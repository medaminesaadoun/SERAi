import json
import uuid
import time
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from pathlib import Path

from database import (
    init_db, save_analysis, get_all_analyses, get_analysis, update_pdf_path,
    delete_analysis, save_profile, get_all_profiles, get_profile, update_profile,
    delete_profile, get_analyses_by_company, save_chat_message, get_chat_history,
    clear_chat_history, save_draft, get_draft, get_drafts_for_company,
    delete_draft, get_latest_draft_for_company,
)
from llm import run_analysis, check_ollama_health, stream_analysis, test_model_inference, generate_comparison_insight, stream_playbook, get_active_model, set_active_model, PRIMARY_MODEL, CHAT_MODEL, OLLAMA_URL
from models import AnalysisRequest, AnalysisResponse, AnalysisResult, AnalysisSummary, HealthResponse, ComparisonInsight, ProfileSaveRequest, ProfileResponse, PlaybookRequest, CacheStatsResponse, CacheClearResponse, ChatRequest, ChatMessage, ChatHistoryResponse,     DraftSaveRequest, DraftResponse, DraftListItem
from pdf_generator import generate_pdf, PDF_AVAILABLE
from cache import cache_manager, hash_request
from chat import stream_chat_response
from mitre_tactics import TACTICS_ORDERED, infer_tactic
from tasks import TaskEmitter, CancelledError


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print(f"[STARTUP] Analysis model: {PRIMARY_MODEL}", flush=True)
    print(f"[STARTUP] Chat model:     {CHAT_MODEL} (fallback: {PRIMARY_MODEL})", flush=True)
    yield


app = FastAPI(
    title="SERAi API",
    description="Social Engineering Risk Analyzer - local-only, powered by Ollama",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    import httpx as _httpx
    health = await check_ollama_health()
    installed_models: list[str] = []
    if health["ollama_connected"]:
        try:
            async with _httpx.AsyncClient() as c:
                r = await c.get(f"{os.getenv('OLLAMA_HOST', 'http://localhost:11434')}/api/tags", timeout=5.0)
                if r.status_code == 200:
                    installed_models = [m["name"] for m in r.json().get("models", [])]
        except Exception:
            pass
    installed_prefixes = [m.split(":")[0] for m in installed_models]
    chat_model_available = (
        CHAT_MODEL in installed_models
        or CHAT_MODEL.split(":")[0] in installed_prefixes
    )
    return HealthResponse(
        status="ok",
        ollama_connected=health["ollama_connected"],
        model=health["model"],
        message=health["message"],
        chat_model=CHAT_MODEL,
        chat_model_available=chat_model_available,
        installed_models=installed_models,
    )


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest, force: bool = False):
    if not request.authorized:
        raise HTTPException(
            status_code=400,
            detail="You must confirm authorization to perform this analysis.",
        )

    form_dict = request.model_dump()
    model_name = get_active_model() or PRIMARY_MODEL

    # ── Cache check ──
    if not force:
        cached = await cache_manager.get(form_dict, model_name)
        if cached:
            result = AnalysisResult(**cached["analysis_result"])
            analysis_id = await save_analysis(
                company_name=request.company_name,
                form_data=form_dict,
                analysis_result=cached["analysis_result"],
            )
            stored = await get_analysis(analysis_id)
            return AnalysisResponse(
                id=analysis_id,
                timestamp=stored["timestamp"],
                company_name=request.company_name,
                result=result,
            )

    try:
        result = await run_analysis(request)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    result_dict = result.model_dump()
    await cache_manager.put(form_dict, result_dict, model_name)

    analysis_id = await save_analysis(
        company_name=request.company_name,
        form_data=form_dict,
        analysis_result=result_dict,
    )

    stored = await get_analysis(analysis_id)

    return AnalysisResponse(
        id=analysis_id,
        timestamp=stored["timestamp"],
        company_name=request.company_name,
        result=result,
    )


@app.get("/api/health/test")
async def health_test():
    """Actually run a minimal inference call - confirms the model is loaded and generating."""
    return await test_model_inference()


@app.post("/api/analyze/stream")
async def analyze_stream(http_request: Request, request: AnalysisRequest, force: bool = False):
    if not request.authorized:
        raise HTTPException(
            status_code=400,
            detail="You must confirm authorization to perform this analysis.",
        )

    emitter = TaskEmitter().bind(http_request)

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"

            form_dict = request.model_dump()
            model_name = get_active_model() or PRIMARY_MODEL
            t_start = time.monotonic()
            tasks_completed: list[str] = []
            accumulated_text = ""

            # ── Cache check ──
            yield f"data: {json.dumps(emitter._emit_sync('t1', 'Cache check', 'started'))}\n\n"  # noqa: SLF001
            if not force:
                cached = await cache_manager.get(form_dict, model_name)
                if cached:
                    elapsed_ms = int((time.monotonic() - t_start) * 1000)
                    yield f"data: {json.dumps({'type': 'cache_hit', 'elapsed_ms': elapsed_ms, 'created_at': cached['created_at'], 'access_count': cached['access_count']})}\n\n"
                    yield f"data: {json.dumps(emitter.complete('t1', 'Cache check', elapsed_ms))}\n\n"
                    tasks_completed.append('t1')
                    analysis_id = await save_analysis(
                        company_name=request.company_name,
                        form_data=form_dict,
                        analysis_result=cached["analysis_result"],
                    )
                    stored = await get_analysis(analysis_id)
                    yield f"data: {json.dumps({'type': 'done', 'analysis': {'id': analysis_id, 'timestamp': stored['timestamp'], 'company_name': request.company_name, 'result': cached['analysis_result'], 'cache': {'hit': True, 'elapsed_ms': elapsed_ms, 'created_at': cached['created_at']}}})}\n\n"
                    return

            elapsed_cache = int((time.monotonic() - t_start) * 1000)
            yield f"data: {json.dumps(emitter.complete('t1', 'Cache check', elapsed_cache))}\n\n"
            tasks_completed.append('t1')

            # ── Build prompt ──
            yield f"data: {json.dumps(emitter._emit_sync('t2', 'Building analysis prompt', 'started'))}\n\n"  # noqa: SLF001
            if await emitter.check_cancelled():
                yield f"data: {json.dumps(emitter.cancelled_event())}\n\n"
                stub_id = await _write_cancelled_stub(request, form_dict, tasks_completed, 0.2)
                yield f"data: {json.dumps({'type': 'cancelled', 'analysis_id': stub_id, 'progress_pct': 0.2, 'tasks_completed': tasks_completed})}\n\n"
                return
            elapsed_prompt = 30
            yield f"data: {json.dumps(emitter.complete('t2', 'Building analysis prompt', elapsed_prompt))}\n\n"
            tasks_completed.append('t2')

            # ── Query LLM ──
            yield f"data: {json.dumps(emitter._emit_sync('t3', f'Querying LLM ({model_name})', 'started'))}\n\n"  # noqa: SLF001
            full_result = None
            try:
                async for event_type, data in stream_analysis(request, is_cancelled=emitter.check_cancelled):
                    if event_type in ("token", "thinking"):
                        if event_type == "token":
                            accumulated_text += data
                        yield f"data: {json.dumps({'type': event_type, 'content': data})}\n\n"
                    elif event_type == "result":
                        full_result = data
            except CancelledError:
                # User disconnected mid-stream. Save a stub for History.
                progress = 0.6 if accumulated_text else 0.4
                stub_id = await _write_cancelled_stub(request, form_dict, tasks_completed, progress)
                yield f"data: {json.dumps(emitter._emit_sync('t3', f'Querying LLM ({model_name})', 'cancelled'))}\n\n"  # noqa: SLF001
                yield f"data: {json.dumps({'type': 'cancelled', 'analysis_id': stub_id, 'progress_pct': progress, 'tasks_completed': tasks_completed, 'partial_text': accumulated_text})}\n\n"
                return

            elapsed_llm = int((time.monotonic() - t_start) * 1000) - elapsed_cache - elapsed_prompt
            yield f"data: {json.dumps(emitter.complete('t3', f'Querying LLM ({model_name})', elapsed_llm))}\n\n"
            tasks_completed.append('t3')

            if full_result is None:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No result produced by model'})}\n\n"
                return

            # ── Parse + MITRE + Cache + Save (small tasks, batched for the UI) ──
            yield f"data: {json.dumps(emitter._emit_sync('t4', 'Parsing & mapping', 'started'))}\n\n"  # noqa: SLF001
            result_dict = full_result.model_dump()

            yield f"data: {json.dumps(emitter._emit_sync('t5', 'Caching result', 'started'))}\n\n"  # noqa: SLF001
            await cache_manager.put(form_dict, result_dict, model_name)

            yield f"data: {json.dumps(emitter._emit_sync('t6', 'Saving to database', 'started'))}\n\n"  # noqa: SLF001
            analysis_id = await save_analysis(
                company_name=request.company_name,
                form_data=form_dict,
                analysis_result=result_dict,
            )
            stored = await get_analysis(analysis_id)
            elapsed_total = int((time.monotonic() - t_start) * 1000)

            yield f"data: {json.dumps(emitter.complete('t4', 'Parsing & mapping', 80))}\n\n"
            tasks_completed.append('t4')
            yield f"data: {json.dumps(emitter.complete('t5', 'Caching result', 40))}\n\n"
            tasks_completed.append('t5')
            yield f"data: {json.dumps(emitter.complete('t6', 'Saving to database', 60))}\n\n"
            tasks_completed.append('t6')

            yield f"data: {json.dumps({'type': 'done', 'analysis': {'id': analysis_id, 'timestamp': stored['timestamp'], 'company_name': request.company_name, 'result': result_dict, 'cache': {'hit': False, 'elapsed_ms': elapsed_total}}})}\n\n"

        except CancelledError:
            # Outer catch - safety net
            yield f"data: {json.dumps(emitter.cancelled_event())}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _write_cancelled_stub(request, form_dict, tasks_completed, progress_pct) -> str:
    """Persist a stub row marking the analysis as cancelled. Returns stub id."""
    return await save_analysis(
        company_name=request.company_name,
        form_data=form_dict,
        analysis_result=None,
        status="cancelled",
        cancelled_at_pct=progress_pct,
    )


@app.get("/api/analyses", response_model=list[AnalysisSummary])
async def list_analyses():
    rows = await get_all_analyses()
    return [AnalysisSummary(**r) for r in rows]


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_detail(analysis_id: str):
    data = await get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisResponse(
        id=data["id"],
        timestamp=data["timestamp"],
        company_name=data["company_name"],
        result=AnalysisResult(**data["analysis_result"]),
    )


@app.delete("/api/analyses/{analysis_id}", status_code=204)
async def delete_analysis_route(analysis_id: str):
    data = await get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    pdf_path = data.get("pdf_path")
    if pdf_path:
        Path(pdf_path).unlink(missing_ok=True)
    await delete_analysis(analysis_id)


@app.get("/api/analyses/{analysis_id}/report", response_class=HTMLResponse)
async def get_report_html(analysis_id: str):
    """Serve the analysis as a printable HTML page (works on all platforms)."""
    from pdf_generator import jinja_env, risk_color
    from datetime import datetime

    data = await get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    try:
        dt = datetime.fromisoformat(data["timestamp"])
        formatted_date = dt.strftime("%B %d, %Y at %H:%M UTC")
    except Exception:
        formatted_date = data["timestamp"]

    result = data["analysis_result"]

    # Check for prior analysis for comparison insight
    prior_analyses = await get_analyses_by_company(data["company_name"])
    prior = next((a for a in reversed(prior_analyses) if a["id"] != analysis_id), None)
    comparison = None
    if prior:
        try:
            insight_data = await generate_comparison_insight(data, prior)
            comparison = insight_data
        except Exception:
            comparison = None

    template = jinja_env.get_template("report.html")
    html = template.render(
        company_name=data["company_name"],
        formatted_date=formatted_date,
        analysis_id=analysis_id,
        result=result,
        risk_color=risk_color(result.get("risk_level", "LOW")),
        risk_level=result.get("risk_level", "LOW"),
        global_score=result.get("global_score", 0),
        dimension_scores=result.get("dimension_scores", {}),
        priority_targets=result.get("priority_targets", []),
        attack_scenarios=result.get("attack_scenarios", []),
        recommendations=result.get("recommendations", []),
        executive_summary=result.get("executive_summary", ""),
        risk_color_fn=risk_color,
        comparison=comparison,
    )
    # Inject a print-on-load script and a floating print button
    inject = """
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.textContent = '⬇ Save as PDF';
    Object.assign(btn.style, {
      position:'fixed', bottom:'24px', right:'24px', zIndex:'9999',
      padding:'10px 20px', background:'#22c55e', color:'#000',
      border:'none', borderRadius:'6px', fontWeight:'bold',
      fontSize:'14px', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.4)'
    });
    btn.onclick = () => window.print();
    document.body.appendChild(btn);
  });
</script>
<style>@media print { button { display:none !important; } }</style>
"""
    html = html.replace("</body>", inject + "</body>")
    return HTMLResponse(content=html)


@app.get("/api/analyses/{analysis_id}/pdf")
async def get_pdf(analysis_id: str):
    if not PDF_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="PDF generation unavailable - install WeasyPrint with GTK3 system libraries.",
        )

    data = await get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    pdf_path = data.get("pdf_path")
    if not pdf_path or not Path(pdf_path).exists():
        try:
            pdf_path = generate_pdf(
                analysis_id=analysis_id,
                company_name=data["company_name"],
                analysis_result=data["analysis_result"],
                timestamp=data["timestamp"],
            )
            await update_pdf_path(analysis_id, pdf_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"SERAi-report-{data['company_name'].replace(' ', '_')}.pdf",
    )


# -- Model selector endpoints -------------------------------------------------

@app.get("/api/models")
async def list_models():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                return {
                    "models": [{"name": m["name"], "size": m.get("size", 0)} for m in models],
                    "active": get_active_model() or PRIMARY_MODEL,
                }
    except Exception:
        pass
    return {"models": [], "active": get_active_model() or PRIMARY_MODEL}


@app.post("/api/settings/model")
async def select_model(body: dict):
    model = body.get("model", "").strip()
    if not model:
        raise HTTPException(status_code=400, detail="model name required")
    set_active_model(model)
    return {"active": model}


# -- Playbook endpoint --------------------------------------------------------

@app.post("/api/scenarios/playbook/stream")
async def stream_scenario_playbook(http_request: Request, request: PlaybookRequest):
    emitter = TaskEmitter().bind(http_request)

    async def event_generator():
        accumulated = ""
        try:
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"
            yield f"data: {json.dumps(emitter._emit_sync('pt1', 'Building playbook context', 'started'))}\n\n"

            if await emitter.check_cancelled():
                yield f"data: {json.dumps(emitter._emit_sync('pt1', 'Building playbook context', 'cancelled'))}\n\n"
                yield f"data: {json.dumps(emitter.cancelled_event())}\n\n"
                return

            yield f"data: {json.dumps(emitter.complete('pt1', 'Building playbook context', 30))}\n\n"
            yield f"data: {json.dumps(emitter._emit_sync('pt2', 'Generating playbook', 'started'))}\n\n"

            try:
                async for event_type, data in stream_playbook(
                    request.scenario, request.company_name, request.mode, request.context,
                    is_cancelled=emitter.check_cancelled,
                ):
                    if event_type == "token":
                        accumulated += data
                    yield f"data: {json.dumps({'type': event_type, 'content': data})}\n\n"
            except CancelledError:
                yield f"data: {json.dumps(emitter._emit_sync('pt2', 'Generating playbook', 'cancelled'))}\n\n"
                yield f"data: {json.dumps({'type': 'cancelled', 'partial_text': accumulated})}\n\n"
                return

            yield f"data: {json.dumps(emitter.complete('pt2', 'Generating playbook', 0))}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except CancelledError:
            yield f"data: {json.dumps(emitter.cancelled_event())}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


# -- Profile endpoints --------------------------------------------------------

@app.get("/api/profiles", response_model=list[ProfileResponse])
async def list_profiles():
    rows = await get_all_profiles()
    return [ProfileResponse(**r) for r in rows]


@app.post("/api/profiles", response_model=ProfileResponse, status_code=201)
async def create_profile(req: ProfileSaveRequest):
    result = await save_profile(req.name, req.form_data)
    return ProfileResponse(**result)


@app.get("/api/profiles/{profile_id}")
async def get_profile_detail(profile_id: str):
    data = await get_profile(profile_id)
    if not data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return data


@app.put("/api/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile_route(profile_id: str, req: ProfileSaveRequest):
    data = await get_profile(profile_id)
    if not data:
        raise HTTPException(status_code=404, detail="Profile not found")
    result = await update_profile(profile_id, req.name, req.form_data)
    return ProfileResponse(**result)


@app.delete("/api/profiles/{profile_id}", status_code=204)
async def delete_profile_route(profile_id: str):
    data = await get_profile(profile_id)
    if not data:
        raise HTTPException(status_code=404, detail="Profile not found")
    await delete_profile(profile_id)


# -- Comparison endpoint -------------------------------------------------------

@app.get("/api/analyses/{analysis_id}/comparison")
async def get_comparison(analysis_id: str):
    current = await get_analysis(analysis_id)
    if not current:
        raise HTTPException(status_code=404, detail="Analysis not found")

    prior_analyses = await get_analyses_by_company(current["company_name"])
    prior = next((a for a in reversed(prior_analyses) if a["id"] != analysis_id), None)

    if not prior:
        from fastapi.responses import Response
        return Response(status_code=204)

    insight_data = await generate_comparison_insight(current, prior)
    return ComparisonInsight(**insight_data)


# -- Cache endpoints ----------------------------------------------------------

@app.get("/api/cache/stats", response_model=CacheStatsResponse)
async def cache_stats():
    stats = await cache_manager.stats()
    return CacheStatsResponse(**stats)


@app.delete("/api/cache", response_model=CacheClearResponse)
async def cache_clear():
    cleared = await cache_manager.clear()
    return CacheClearResponse(cleared=cleared)


# -- MITRE ATT&CK tactics endpoint -------------------------------------------

@app.get("/api/mitre/tactics")
async def list_mitre_tactics():
    return {"tactics": TACTICS_ORDERED}


# -- Draft endpoints ----------------------------------------------------------

@app.post("/api/drafts", response_model=DraftResponse, status_code=201)
async def create_draft(body: DraftSaveRequest):
    """Save a partial-text draft for a cancelled analysis."""
    if not await get_analysis(body.analysis_id):
        raise HTTPException(status_code=404, detail="Analysis not found")
    return DraftResponse(**await save_draft(
        analysis_id=body.analysis_id,
        company_name=body.company_name,
        form_data_hash=body.form_data_hash,
        partial_text=body.partial_text,
        progress_pct=body.progress_pct,
        tasks_completed=body.tasks_completed,
    ))


@app.get("/api/drafts/{draft_id}", response_model=DraftResponse)
async def fetch_draft(draft_id: str):
    draft = await get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found or expired")
    return DraftResponse(**draft)


@app.get("/api/companies/{company_name}/drafts", response_model=list[DraftListItem])
async def list_drafts_for_company(company_name: str):
    rows = await get_drafts_for_company(company_name)
    return [DraftListItem(**r) for r in rows]


@app.get("/api/companies/{company_name}/drafts/latest", response_model=DraftListItem | None)
async def latest_draft_for_company(company_name: str):
    row = await get_latest_draft_for_company(company_name)
    return DraftListItem(**row) if row else None


@app.delete("/api/drafts/{draft_id}", response_model=CacheClearResponse)
async def remove_draft(draft_id: str):
    cleared = await delete_draft(draft_id)
    return CacheClearResponse(cleared=cleared)


# -- Chat endpoints -----------------------------------------------------------

@app.get("/api/analyses/{analysis_id}/chat", response_model=ChatHistoryResponse)
async def get_chat(analysis_id: str):
    data = await get_analysis(analysis_id)
    if not data:
        return ChatHistoryResponse(messages=[])
    messages = await get_chat_history(analysis_id)
    return ChatHistoryResponse(messages=[ChatMessage(**m) for m in messages])


@app.delete("/api/analyses/{analysis_id}/chat", response_model=CacheClearResponse)
async def clear_chat(analysis_id: str):
    cleared = await clear_chat_history(analysis_id)
    return CacheClearResponse(cleared=cleared)


@app.post("/api/analyses/{analysis_id}/chat/stream")
async def chat_stream(http_request: Request, analysis_id: str, request: ChatRequest):
    emitter = TaskEmitter().bind(http_request)
    data = await get_analysis(analysis_id)
    if data:
        company = data["company_name"]
        form_data = data["form_data"]
        analysis_result = data["analysis_result"]
    elif request.context:
        company = request.context.get("company_name", "Unknown")
        form_data = request.context.get("form_data") or {}
        analysis_result = request.context.get("result") or request.context.get("analysis_result") or {}
    else:
        raise HTTPException(status_code=404, detail="Analysis not found")

    user_msg = (request.message or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Empty message")

    history = await get_chat_history(analysis_id)
    user_message_id = str(uuid.uuid4())
    await save_chat_message(user_message_id, analysis_id, "user", user_msg)

    mode = request.mode or "attack"

    async def event_generator():
        assistant_message_id = str(uuid.uuid4())
        accumulated: list[str] = []
        try:
            yield f"data: {json.dumps({'type': 'connected', 'user_message_id': user_message_id, 'assistant_message_id': assistant_message_id})}\n\n"
            yield f"data: {json.dumps(emitter._emit_sync('ct1', 'Loading chat history', 'started'))}\n\n"
            yield f"data: {json.dumps(emitter.complete('ct1', 'Loading chat history', 0))}\n\n"
            yield f"data: {json.dumps(emitter._emit_sync('ct2', 'Generating response', 'started'))}\n\n"

            try:
                async for event_type, content in stream_chat_response(
                    company_name=company,
                    form_data=form_data,
                    analysis_result=analysis_result,
                    history=history,
                    user_message=user_msg,
                    mode=mode,
                    is_cancelled=emitter.check_cancelled,
                ):
                    if event_type == "token":
                        accumulated.append(content)
                    yield f"data: {json.dumps({'type': event_type, 'content': content})}\n\n"
            except CancelledError:
                partial = "".join(accumulated)
                if partial:
                    await save_chat_message(assistant_message_id, analysis_id, "assistant", partial + "\n\n[cancelled]")
                yield f"data: {json.dumps(emitter._emit_sync('ct2', 'Generating response', 'cancelled'))}\n\n"
                yield f"data: {json.dumps({'type': 'cancelled', 'assistant_message_id': assistant_message_id, 'partial_text': partial})}\n\n"
                return

            yield f"data: {json.dumps(emitter.complete('ct2', 'Generating response', 0))}\n\n"
            yield f"data: {json.dumps(emitter._emit_sync('ct3', 'Saving exchange', 'started'))}\n\n"

            full_text = "".join(accumulated)
            await save_chat_message(assistant_message_id, analysis_id, "assistant", full_text)
            yield f"data: {json.dumps(emitter.complete('ct3', 'Saving exchange', 30))}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'assistant_message_id': assistant_message_id, 'length': len(full_text)})}\n\n"

        except CancelledError:
            yield f"data: {json.dumps(emitter.cancelled_event())}\n\n"
        except Exception as e:
            err_text = "".join(accumulated)
            if err_text:
                await save_chat_message(assistant_message_id, analysis_id, "assistant", err_text + "\n\n[error: stream interrupted]")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
