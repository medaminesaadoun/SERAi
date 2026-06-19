"""Result cache for SERAi analyses.

Hashes a canonical form of the request + active model so identical OSINT inputs
return the same result instantly. Hash is sensitive to model name so swapping
the LLM automatically invalidates prior results.
"""
import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any

from database import (
    get_cached_analysis,
    put_cached_analysis,
    get_cache_stats,
    delete_cached_analysis,
    clear_cache,
)


# Fields that don't affect the analysis output and should be excluded from the hash.
_IGNORED_TOP_LEVEL = {"authorized"}
_IGNORED_NESTED = set()


def _canonicalize(value: Any) -> Any:
    """Recursively normalize a value so semantically equal inputs hash identically.

    - Strips empty strings / empty lists / false booleans from canonical form.
    - Sorts dict keys for stable ordering.
    """
    if isinstance(value, dict):
        return {k: _canonicalize(v) for k, v in sorted(value.items()) if not _is_empty(v)}
    if isinstance(value, list):
        cleaned = [_canonicalize(v) for v in value if not _is_empty(v)]
        return cleaned
    return value


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, (list, dict)) and len(value) == 0:
        return True
    if isinstance(value, bool):
        return False
    return False


def _strip_for_hash(form_data: dict) -> dict:
    """Remove the authorization flag and any other non-deterministic noise."""
    return {k: v for k, v in form_data.items() if k not in _IGNORED_TOP_LEVEL}


def hash_request(form_data: dict, model: str) -> str:
    """Return a stable SHA-256 hex digest of the canonical request + model."""
    cleaned = _strip_for_hash(form_data)
    canonical = _canonicalize(cleaned)
    payload = json.dumps(
        {"model": model, "form_data": canonical},
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class CacheManager:
    """Thin facade over the analysis_cache table with in-flight deduplication."""

    def __init__(self) -> None:
        self._inflight: dict[str, Any] = {}

    async def get(self, form_data: dict, model: str) -> dict | None:
        key = hash_request(form_data, model)
        entry = await get_cached_analysis(key)
        if not entry:
            return None
        return {
            "form_data_hash": entry["form_data_hash"],
            "company_name": entry["company_name"],
            "form_data": entry["form_data"],
            "analysis_result": entry["analysis_result"],
            "model": entry["model"],
            "created_at": entry["created_at"],
            "last_accessed_at": entry["last_accessed_at"],
            "access_count": entry["access_count"],
        }

    async def put(self, form_data: dict, analysis_result: dict, model: str) -> str:
        key = hash_request(form_data, model)
        company_name = form_data.get("company_name", "Unknown")
        await put_cached_analysis(key, company_name, form_data, analysis_result, model)
        return key

    async def stats(self) -> dict:
        return await get_cache_stats()

    async def delete(self, form_data_hash: str) -> None:
        await delete_cached_analysis(form_data_hash)

    async def clear(self) -> int:
        return await clear_cache()

    def age_seconds(self, created_at: str) -> int:
        try:
            dt = datetime.fromisoformat(created_at)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return max(0, int((datetime.now(timezone.utc) - dt).total_seconds()))
        except Exception:
            return 0

    @staticmethod
    def format_age(seconds: int) -> str:
        if seconds < 60:
            return f"{seconds}s ago"
        if seconds < 3600:
            return f"{seconds // 60}m ago"
        if seconds < 86400:
            return f"{seconds // 3600}h ago"
        return f"{seconds // 86400}d ago"


cache_manager = CacheManager()
