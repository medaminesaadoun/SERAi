from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path

from database import init_db, save_analysis, get_all_analyses, get_analysis, update_pdf_path, delete_analysis
from llm import run_analysis, check_ollama_health
from models import AnalysisRequest, AnalysisResponse, AnalysisResult, AnalysisSummary, HealthResponse
from pdf_generator import generate_pdf, PDF_AVAILABLE


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="SERAi API",
    description="Social Engineering Risk Analyzer — local-only, powered by Ollama",
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
    health = await check_ollama_health()
    return HealthResponse(
        status="ok",
        ollama_connected=health["ollama_connected"],
        model=health["model"],
        message=health["message"],
    )


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    if not request.authorized:
        raise HTTPException(
            status_code=400,
            detail="You must confirm authorization to perform this analysis.",
        )

    try:
        result = await run_analysis(request)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    result_dict = result.model_dump()
    form_dict = request.model_dump()

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


@app.get("/api/analyses/{analysis_id}/pdf")
async def get_pdf(analysis_id: str):
    if not PDF_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="PDF generation unavailable — install WeasyPrint with GTK3 system libraries.",
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
