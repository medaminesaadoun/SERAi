from dotenv import load_dotenv
load_dotenv()

import json
import os
import re
import httpx
from models import AnalysisRequest, AnalysisResult

OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434")
PRIMARY_MODEL = "qwen3.5:4b"
FALLBACK_MODEL = "llama3.1:8b"
MAX_RETRIES = 3

SYSTEM_PROMPT = """You are an expert red team consultant specializing in social engineering risk assessment.
Analyze the provided organizational exposure data and respond ONLY with valid JSON matching the exact schema provided.
Do not include any explanation, markdown formatting, or text outside the JSON object.
Be thorough, realistic, and base your assessment on the actual data provided."""


def build_user_prompt(request: AnalysisRequest) -> str:
    employees_text = ""
    for emp in request.people.employees:
        linkedin = "LinkedIn visible" if emp.linkedin_visible else "LinkedIn not found"
        employees_text += f"  - {emp.name} ({emp.role}): {linkedin}, email format: {emp.email_format or 'unknown'}\n"

    prompt = f"""Analyze the social engineering attack surface for organization: "{request.company_name}"

== PEOPLE EXPOSURE ==
Employees identified:
{employees_text if employees_text else "  No specific employees provided"}
Org chart exposed: {"YES" if request.people.org_chart_exposed else "NO"}
Org chart details: {request.people.org_chart_details or "N/A"}
Approximate headcount: {request.people.total_employees_approx or "Unknown"}

== TECHNOLOGY EXPOSURE ==
Public tech stack: {request.technology.public_tech_stack or "Not specified"}
Tools revealed in job postings: {request.technology.job_posting_tools or "None identified"}
Exposed services/portals: {request.technology.exposed_services or "None identified"}
Cloud providers: {request.technology.cloud_providers or "Unknown"}
Visible frameworks: {request.technology.frameworks_visible or "None"}

== PROCESS EXPOSURE ==
Ticketing system visible: {"YES — " + request.processes.ticketing_system_name if request.processes.ticketing_system_visible else "NO"}
Public onboarding docs: {"YES" if request.processes.onboarding_docs_public else "NO"}
Known vendor/partner relationships: {request.processes.vendor_relationships or "None identified"}
Other internal process leaks: {request.processes.internal_process_leaks or "None"}

== DIGITAL FOOTPRINT ==
Social media presence: {request.digital_footprint.social_media_presence or "Not assessed"}
Website intelligence: {request.digital_footprint.website_info or "Not assessed"}
News/press mentions: {request.digital_footprint.news_mentions or "None"}
Public GitHub repos: {request.digital_footprint.github_repos or "None found"}
Pastebin/leak sites: {request.digital_footprint.pastebin_leaks or "None found"}
Other exposure: {request.digital_footprint.other_exposure or "None"}

Respond with ONLY this JSON structure (no markdown, no explanation):
{{
  "global_score": <integer 0-100, higher = more exposed/risky>,
  "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "dimension_scores": {{
    "people": <integer 0-100>,
    "technology": <integer 0-100>,
    "processes": <integer 0-100>,
    "digital_footprint": <integer 0-100>
  }},
  "priority_targets": [
    {{
      "name": "<string>",
      "role": "<string>",
      "risk_level": "<MAX|HIGH|MEDIUM|LOW>",
      "attack_vectors": ["<string>"],
      "protection": "<string>"
    }}
  ],
  "attack_scenarios": [
    {{
      "title": "<string>",
      "type": "<phishing|pretexting|vishing|BEC|other>",
      "mitre_technique": "T<4 digits>",
      "description": "<string>",
      "likelihood": "<HIGH|MEDIUM|LOW>",
      "impact": "<HIGH|MEDIUM|LOW>"
    }}
  ],
  "recommendations": [
    {{
      "priority": <integer starting at 1>,
      "title": "<string>",
      "description": "<string>",
      "mitre_mitigation": "M<4 digits>"
    }}
  ],
  "executive_summary": "<2-3 non-technical sentences summarizing overall risk>"
}}"""
    return prompt


def extract_json(text: str) -> dict:
    """Extract JSON object from LLM output, stripping any surrounding text."""
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find JSON block in markdown code fence
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find first complete JSON object
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("No valid JSON found in LLM response")


async def get_available_model(client: httpx.AsyncClient) -> str:
    """Return PRIMARY_MODEL if available, else FALLBACK_MODEL."""
    try:
        resp = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            # Normalise: strip :latest suffix for comparison
            normalized = [m.split(":")[0] for m in models]
            if PRIMARY_MODEL.split(":")[0] in normalized or PRIMARY_MODEL in models:
                return PRIMARY_MODEL
            if FALLBACK_MODEL.split(":")[0] in normalized or FALLBACK_MODEL in models:
                return FALLBACK_MODEL
    except Exception:
        pass
    return PRIMARY_MODEL  # default; will fail gracefully


async def stream_analysis(request: AnalysisRequest):
    """Async generator: yields ('token', str) for each LLM chunk, then ('result', AnalysisResult)."""
    async with httpx.AsyncClient() as client:
        model = await get_available_model(client)
        user_prompt = build_user_prompt(request)

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "stream": True,
            "options": {
                "temperature": 0.1,
                "num_predict": 4096,
            },
        }

        full_content = ""
        async with client.stream(
            "POST",
            f"{OLLAMA_URL}/api/chat",
            json=payload,
            timeout=httpx.Timeout(connect=10.0, read=300.0, write=10.0, pool=10.0),
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        full_content += token
                        yield ("token", token)
                    if chunk.get("done"):
                        break
                except json.JSONDecodeError:
                    continue

        data = extract_json(full_content)
        result = AnalysisResult(**data)
        yield ("result", result)


async def run_analysis(request: AnalysisRequest) -> AnalysisResult:
    async with httpx.AsyncClient(timeout=120.0) as client:
        model = await get_available_model(client)
        user_prompt = build_user_prompt(request)

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 4096,
                    },
                }

                resp = await client.post(
                    f"{OLLAMA_URL}/api/chat",
                    json=payload,
                    timeout=120.0,
                )
                resp.raise_for_status()

                content = resp.json()["message"]["content"]
                data = extract_json(content)
                result = AnalysisResult(**data)
                return result

            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES:
                    # Add more explicit instruction on retry
                    user_prompt += "\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY the JSON object, nothing else."
                    continue

        raise RuntimeError(
            f"LLM analysis failed after {MAX_RETRIES} attempts. Last error: {last_error}"
        )


async def check_ollama_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                model_names = [m.split(":")[0] for m in models]
                active = PRIMARY_MODEL.split(":")[0] in model_names
                return {
                    "ollama_connected": True,
                    "model": PRIMARY_MODEL if active else (models[0] if models else "none"),
                    "message": f"Ollama running. Models available: {', '.join(models) or 'none'}",
                }
    except Exception as e:
        return {
            "ollama_connected": False,
            "model": PRIMARY_MODEL,
            "message": f"Cannot reach Ollama at {OLLAMA_URL}: {e}",
        }
