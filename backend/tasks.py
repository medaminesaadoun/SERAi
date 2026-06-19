"""SSE task emitter for SERAi streaming endpoints.

Wraps each streaming endpoint with a task-list emitter so the frontend can
render a live progress checklist. The emitter yields ``task`` events on the
SSE channel and exposes an ``is_cancelled()`` check that generators should
poll to abort expensive work (e.g. Ollama calls) when the client disconnects.

Usage::

    emitter = TaskEmitter()
    yield await emitter.task_started("t1", "Cache check")
    yield await emitter.task_completed("t1", elapsed_ms=12)
    async with emitter.task("t2", "Querying LLM") as ctx:
        async for token in ollama_stream:
            if await emitter.is_cancelled():
                raise CancelledError()
            yield token
"""
from __future__ import annotations

import asyncio
import contextlib
import time
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Awaitable, Callable, Optional


@dataclass
class TaskState:
    id: str
    label: str
    status: str = "pending"  # pending | started | completed | failed | cancelled
    elapsed_ms: Optional[int] = None
    error: Optional[str] = None
    meta: dict[str, Any] = field(default_factory=dict)


class CancelledError(Exception):
    """Raised when the SSE client disconnects mid-stream."""


class TaskEmitter:
    """Tracks a list of named tasks and emits SSE events for each transition.

    The emitter is independent of the FastAPI Request — pass the request
    into :meth:`is_cancelled` so the emitter can detect disconnects.
    """

    def __init__(self) -> None:
        self._tasks: dict[str, TaskState] = {}
        self._cancel_event = asyncio.Event()
        self._request: Any = None

    def bind(self, request: Any) -> "TaskEmitter":
        """Bind the FastAPI Request so :meth:`is_cancelled` can poll it."""
        self._request = request
        return self

    def is_cancelled(self) -> bool:
        return self._cancel_event.is_set()

    async def check_cancelled(self) -> bool:
        """Async check for cancellation. Returns True if cancelled."""
        if self._cancel_event.is_set():
            return True
        if self._request is not None:
            try:
                if await self._request.is_disconnected():
                    self._cancel_event.set()
                    return True
            except Exception:
                # If the request object misbehaves, treat as cancelled.
                self._cancel_event.set()
                return True
        return False

    @contextlib.asynccontextmanager
    async def task(self, task_id: str, label: str) -> AsyncIterator["TaskContext"]:
        """Context manager wrapping a task's lifetime.

        Emits ``started`` on entry and ``completed`` / ``failed`` / ``cancelled``
        on exit. Yields a :class:`TaskContext` with helpers.
        """
        ctx = TaskContext(emitter=self, task_id=task_id, label=label)
        await self._emit(task_id, label, "started", elapsed_ms=0)
        try:
            yield ctx
        except CancelledError:
            await self._emit(task_id, label, "cancelled", error="client disconnected")
            raise
        except Exception as e:
            await self._emit(task_id, label, "failed", error=str(e))
            raise
        else:
            await self._emit(task_id, label, "completed", elapsed_ms=ctx.elapsed_ms)

    async def _emit(
        self,
        task_id: str,
        label: str,
        status: str,
        elapsed_ms: Optional[int] = None,
        error: Optional[str] = None,
        meta: Optional[dict] = None,
    ) -> dict:
        return self._record(task_id, label, status, elapsed_ms, error, meta)

    def _emit_sync(
        self,
        task_id: str,
        label: str,
        status: str,
        elapsed_ms: Optional[int] = None,
        error: Optional[str] = None,
    ) -> dict:
        """Synchronous variant — does not check cancellation. For use inside
        already-async SSE generators where awaiting is OK but a sync dict is
        more convenient.
        """
        return self._record(task_id, label, status, elapsed_ms, error, None)

    def _record(
        self,
        task_id: str,
        label: str,
        status: str,
        elapsed_ms: Optional[int] = None,
        error: Optional[str] = None,
        meta: Optional[dict] = None,
    ) -> dict:
        ts = TaskState(
            id=task_id,
            label=label,
            status=status,
            elapsed_ms=elapsed_ms,
            error=error,
            meta=meta or {},
        )
        self._tasks[task_id] = ts
        return _to_event(ts)

    def fail(self, task_id: str, label: str, error: str) -> dict:
        return self._record(task_id, label, "failed", error=error)

    def complete(self, task_id: str, label: str, elapsed_ms: int) -> dict:
        return self._record(task_id, label, "completed", elapsed_ms=elapsed_ms)

    def cancelled_event(self) -> dict:
        return {"type": "cancelled"}


@dataclass
class TaskContext:
    emitter: TaskEmitter
    task_id: str
    label: str
    started_at: float = field(default_factory=time.monotonic)

    @property
    def elapsed_ms(self) -> int:
        return int((time.monotonic() - self.started_at) * 1000)

    async def check(self) -> None:
        if await self.emitter.check_cancelled():
            raise CancelledError()


def _to_event(ts: TaskState) -> dict:
    """Convert a TaskState to an SSE event payload."""
    return {
        "type": "task",
        "id": ts.id,
        "label": ts.label,
        "status": ts.status,
        "elapsed_ms": ts.elapsed_ms,
        "error": ts.error,
    }
