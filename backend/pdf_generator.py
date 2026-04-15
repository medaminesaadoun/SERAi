import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
try:
    from weasyprint import HTML
    PDF_AVAILABLE = True
except (ImportError, OSError):
    PDF_AVAILABLE = False
    HTML = None
from datetime import datetime

TEMPLATES_DIR = Path(__file__).parent / "templates"
PDF_DIR = Path(__file__).parent / "pdfs"
PDF_DIR.mkdir(exist_ok=True)

jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


def risk_color(level: str) -> str:
    colors = {
        "LOW": "#22c55e",
        "MEDIUM": "#eab308",
        "HIGH": "#f97316",
        "CRITICAL": "#ef4444",
        "MAX": "#ef4444",
    }
    return colors.get(level.upper(), "#a3e635")


def generate_pdf(analysis_id: str, company_name: str, analysis_result: dict, timestamp: str) -> str:
    template = jinja_env.get_template("report.html")

    # Format timestamp
    try:
        dt = datetime.fromisoformat(timestamp)
        formatted_date = dt.strftime("%B %d, %Y at %H:%M UTC")
    except Exception:
        formatted_date = timestamp

    ctx = {
        "company_name": company_name,
        "formatted_date": formatted_date,
        "analysis_id": analysis_id,
        "result": analysis_result,
        "risk_color": risk_color(analysis_result.get("risk_level", "LOW")),
        "risk_level": analysis_result.get("risk_level", "LOW"),
        "global_score": analysis_result.get("global_score", 0),
        "dimension_scores": analysis_result.get("dimension_scores", {}),
        "priority_targets": analysis_result.get("priority_targets", []),
        "attack_scenarios": analysis_result.get("attack_scenarios", []),
        "recommendations": analysis_result.get("recommendations", []),
        "executive_summary": analysis_result.get("executive_summary", ""),
        "risk_color_fn": risk_color,
    }

    html_content = template.render(**ctx)
    pdf_path = str(PDF_DIR / f"{analysis_id}.pdf")

    HTML(string=html_content, base_url=str(TEMPLATES_DIR)).write_pdf(pdf_path)
    return pdf_path
