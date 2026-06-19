from dotenv import load_dotenv
load_dotenv()

import asyncio
import json
import os
import re
import httpx
from models import AnalysisRequest, AnalysisResult

OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434")
PRIMARY_MODEL = "qwen3.5:4b"
CHAT_MODEL = "qwen3:4b-instruct"
FALLBACK_MODEL = "llama3.1:8b"
MAX_RETRIES = 3

_active_model: str | None = None


def get_active_model() -> str | None:
    return _active_model


def set_active_model(model: str | None):
    global _active_model
    _active_model = model


async def get_available_chat_model(client: httpx.AsyncClient) -> str:
    """Return the chat model (qwen3:4b-instruct), or fall back to PRIMARY_MODEL.

    Used by the chat endpoint only. qwen3.5:4b outputs heavy thinking tokens
    (~30s before any response), so chat uses a dedicated instruct model.
    Falls back gracefully if the chat model is not installed.
    """
    try:
        resp = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            normalized = [m.split(":")[0] for m in models]
            if CHAT_MODEL.split(":")[0] in normalized or CHAT_MODEL in models:
                return CHAT_MODEL
            print(
                f"[LLM] WARNING: {CHAT_MODEL} not installed, "
                f"chat falling back to {PRIMARY_MODEL}",
                flush=True,
            )
    except Exception as e:
        print(
            f"[LLM] WARNING: could not check installed models, "
            f"chat falling back to {PRIMARY_MODEL}: {e}",
            flush=True,
        )
    return PRIMARY_MODEL

SYSTEM_PROMPT = """You are an expert red team consultant specializing in social engineering risk assessment.
Analyze the provided organizational exposure data and respond ONLY with valid JSON matching the exact schema provided.
Do not include any explanation, markdown formatting, or text outside the JSON object.
Be thorough, realistic, and base your assessment on the actual data provided."""


def _backfill_tactics(data: dict) -> None:
    """Populate `mitre_tactic` for any scenario that didn't include it.

    Falls back to the static MITRE technique->tactic lookup in
    `mitre_tactics.py`. Runs in-place on the dict before Pydantic validation.
    If neither the LLM nor the static map knows the technique, leaves
    `mitre_tactic` as `None` so the issue is visible rather than silently
    grouped into Initial Access.
    """
    from mitre_tactics import infer_tactic
    for scenario in data.get("attack_scenarios", []) or []:
        if not scenario.get("mitre_tactic"):
            tactic = infer_tactic(scenario.get("mitre_technique", ""))
            if tactic:
                scenario["mitre_tactic"] = tactic[0]
            else:
                print(
                    f"[WARN] No MITRE tactic for technique "
                    f"'{scenario.get('mitre_technique', '?')}' "
                    f"(scenario: '{scenario.get('title', '?')[:60]}') — leaving None",
                    flush=True,
                )


def build_user_prompt(request: AnalysisRequest) -> str:
    employees_text = ""
    for emp in request.people.employees:
        linkedin = "LinkedIn visible" if emp.linkedin_visible else "LinkedIn not found"
        employees_text += f"  - {emp.name} ({emp.role}): {linkedin}, email format: {emp.email_format or 'unknown'}\n"

    prompt = f"""Analyze the social engineering attack surface for organization: "{request.company_name}"

== VALID MITRE ATT&CK TECHNIQUE IDs (USE THESE — do not invent IDs) ==
Each scenario must use ONE of the following technique IDs (or a closely related sub-technique). Pick the one that BEST matches the scenario's actual attack pattern.

PHISHING / PRETEXTING / BEC:
- T1566 (Phishing) — fraudulent communications to steal credentials/data
  - T1566.001 Spearphishing Attachment
  - T1566.002 Spearphishing Link
  - T1566.003 Spearphishing via Service
- T1656 (Impersonation) — adversary mimics a trusted entity
- T1078 (Valid Accounts) — abuse of legitimate credentials (esp. for BEC)
- T1534 (Email Forwarding Rule) — internal email auto-forwarding for data theft

CREDENTIAL THEFT / BRUTE FORCE:
- T1110 (Brute Force) — password guessing attacks
  - T1110.001 Password Guessing, T1110.003 Password Spraying, T1110.004 Credential Stuffing
- T1555 (Credentials from Password Stores)
- T1606 (Forge Web Credentials)
- T1056 (Input Capture) — keyloggers, form grabbing

VISHING / CALL-BASED:
- T1598 (Phishing for Information) — adversarial voice calls
  - T1598.001 Spearphishing Voice (vishing)

EXECUTION / MALWARE DELIVERY:
- T1204 (User Execution) — victim runs malicious content
  - T1204.001 Malicious Link, T1204.002 Malicious File
- T1059 (Command and Scripting Interpreter)

DISCOVERY / OSINT:
- T1589 (Gather Victim Identity Information)
- T1590 (Gather Victim Network Information)
- T1592 (Gather Victim Host Information)
- T1593 (Search Open Websites/Domains)
- T1595 (Active Scanning)
- T1583 (Acquire Infrastructure)

DEFENSE EVASION (use ONLY for actual evasion patterns, not for phishing):
- T1564 (Hide Artifacts) — hiding malicious files/behavior
- T1027 (Obfuscated Files or Information)
- T1036 (Masquerading)
- T1070 (Indicator Removal)

EXFILTRATION:
- T1041 (Exfiltration Over C2 Channel)
- T1567 (Exfiltration Over Web Service)
- T1048 (Exfiltration Over Alternative Protocol)

IMPACT:
- T1486 (Data Encrypted for Impact) — ransomware
- T1657 (Financial Theft)

CRITICAL: For a CEO Phishing / Business Email Compromise scenario, the correct IDs are T1566.* (Phishing) or T1656 (Impersonation) or T1078 (Valid Accounts) — NOT T1564 (Hide Artifacts, which is defense evasion). Match the technique to what the attacker ACTUALLY DOES.

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
Ticketing system visible: {"YES - " + request.processes.ticketing_system_name if request.processes.ticketing_system_visible else "NO"}
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
      "mitre_tactic": "<MITRE ATT&CK tactic ID, e.g. TA0001 for Initial Access, TA0006 for Credential Access, TA0043 for Reconnaissance>",
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
}}

Quality requirements (apply to ALL string fields):
- executive_summary: minimum 3-4 sentences, name specific risks tied to this company's actual exposure
- attack_scenarios[].description: minimum 2-3 sentences, reference specific technologies/people/services from the intel above
- recommendations[].description: minimum 2-3 sentences with concrete implementation steps, not generic advice
- priority_targets[].protection: name the specific missing control (e.g. "No MFA on VPN portal" not "Improve security")
- Never output generic placeholder text - every field must reference actual data provided above

/no_think"""
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
    """Return the user-selected model, or auto-detect PRIMARY/FALLBACK."""
    if _active_model:
        return _active_model
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


async def stream_analysis(request: AnalysisRequest, is_cancelled=None):
    """Async generator: yields ('token', str) for each LLM chunk, then ('result', AnalysisResult).

    ``is_cancelled`` is an optional async callable returning True when the
    client has disconnected. When it returns True mid-stream, the generator
    raises :class:`tasks.CancelledError` so the caller can skip persistence.
    """
    from tasks import CancelledError  # local import to avoid circular dep

    async def _check():
        if is_cancelled is None:
            return False
        if asyncio.iscoroutinefunction(is_cancelled):
            return await is_cancelled()
        return bool(is_cancelled())

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
            "think": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 4096,
            },
        }

        full_content = ""
        print(f"[STREAM] opening httpx stream to {OLLAMA_URL}", flush=True)
        async with client.stream(
            "POST",
            f"{OLLAMA_URL}/api/chat",
            json=payload,
            timeout=httpx.Timeout(connect=10.0, read=300.0, write=10.0, pool=10.0),
        ) as response:
            print(f"[STREAM] connected, status={response.status_code}", flush=True)
            response.raise_for_status()
            line_count = 0
            async for line in response.aiter_lines():
                if await _check():
                    print(f"[STREAM] cancelled after {line_count} lines", flush=True)
                    raise CancelledError()
                line_count += 1
                if line_count <= 3:
                    try:
                        _dbg = json.loads(line)
                        print(f"[STREAM] line #{line_count} message={_dbg.get('message',{})}", flush=True)
                    except Exception:
                        pass
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                    msg = chunk.get("message", {})
                    content = msg.get("content", "")
                    thinking = msg.get("thinking", "")
                    if content:
                        full_content += content
                        yield ("token", content)
                    elif thinking:
                        # Thinking phase - stream for display but exclude from JSON
                        yield ("thinking", thinking)
                    if chunk.get("done"):
                        print(f"[STREAM] done after {line_count} lines, content chars={len(full_content)}", flush=True)
                        break
                except json.JSONDecodeError:
                    continue

        data = extract_json(full_content)
        _backfill_tactics(data)
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
                    "think": False,
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
                _backfill_tactics(data)
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


async def test_model_inference() -> dict:
    """Send a minimal prompt to the model and return timing + first tokens."""
    import time
    async with httpx.AsyncClient() as client:
        model = await get_available_model(client)
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "Reply with the single word: READY"}],
            "stream": False,
            "options": {"temperature": 0, "num_predict": 16},
        }
        start = time.monotonic()
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                timeout=httpx.Timeout(connect=5.0, read=60.0, write=5.0, pool=5.0),
            )
            resp.raise_for_status()
            elapsed = round(time.monotonic() - start, 2)
            content = resp.json()["message"]["content"].strip()
            return {
                "ok": True,
                "model": model,
                "response": content,
                "elapsed_s": elapsed,
            }
        except Exception as e:
            elapsed = round(time.monotonic() - start, 2)
            return {
                "ok": False,
                "model": model,
                "error": str(e),
                "elapsed_s": elapsed,
            }


async def generate_comparison_insight(current: dict, previous: dict) -> dict:
    """Compare two analysis results and generate AI insight about what changed."""
    def fmt_scores(r):
        ds = r.get("dimension_scores", {})
        return (
            f"Global: {r.get('global_score')} ({r.get('risk_level')})\n"
            f"  People: {ds.get('people')}  Technology: {ds.get('technology')}  "
            f"Processes: {ds.get('processes')}  Digital Footprint: {ds.get('digital_footprint')}"
        )

    prompt = f"""You are a security analyst comparing two social engineering risk assessments for the same organization.

PREVIOUS ASSESSMENT ({previous.get('timestamp', 'earlier')}):
{fmt_scores(previous['analysis_result'])}
Top targets: {', '.join(t['name'] for t in previous['analysis_result'].get('priority_targets', [])[:3])}

CURRENT ASSESSMENT ({current.get('timestamp', 'now')}):
{fmt_scores(current['analysis_result'])}
Top targets: {', '.join(t['name'] for t in current['analysis_result'].get('priority_targets', [])[:3])}

Score delta: {current['analysis_result'].get('global_score', 0) - previous['analysis_result'].get('global_score', 0):+d}

Respond ONLY with valid JSON:
{{
  "score_delta": <integer, negative means improvement>,
  "period": "<from date> to <to date>",
  "summary": "<3-4 sentences: what specifically changed, why scores shifted, what the trend means for this organization>",
  "top_improvements": ["<3-5 specific items: what was concretely done or removed, not vague statements like 'security improved'>", ...],
  "remaining_risks": ["<3-5 specific items: name the exact risk that persists and why it hasn't been resolved>", ...],
  "outlook": "<1-2 sentences naming the single most important next action and its expected impact>"
}}
/no_think"""

    async with httpx.AsyncClient() as client:
        model = await get_available_model(client)
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a security analyst. Respond ONLY with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "think": False,
            "options": {"temperature": 0.1, "num_predict": 2048},
        }
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                timeout=httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=10.0),
            )
            resp.raise_for_status()
            content = resp.json()["message"]["content"]
            data = extract_json(content)
            return data
        except Exception as e:
            return {
                "score_delta": current['analysis_result'].get('global_score', 0) - previous['analysis_result'].get('global_score', 0),
                "period": f"{previous.get('timestamp', '')[:10]} to {current.get('timestamp', '')[:10]}",
                "summary": "Security posture has changed since the last assessment.",
                "top_improvements": [],
                "remaining_risks": [],
                "outlook": "Continue monitoring and implementing recommendations.",
            }


async def stream_playbook(scenario: dict, company_name: str, mode: str, context: dict, is_cancelled=None):
    """Async generator yielding ('token', str) for playbook streaming.

    ``is_cancelled`` is an optional async/sync callable returning True when
    the client has disconnected. See :func:`stream_analysis` for details.
    """
    from tasks import CancelledError

    async def _check():
        if is_cancelled is None:
            return False
        if asyncio.iscoroutinefunction(is_cancelled):
            return await is_cancelled()
        return bool(is_cancelled())

    is_atk = mode == 'attack'
    role = "red team consultant and penetration tester" if is_atk else "blue team security analyst and incident responder"
    framing = (
        "Write from the attacker's perspective. Use active, tactical language: 'the attacker does X', 'craft a message that...', 'exploit the fact that...'. Be specific and actionable."
        if is_atk else
        "Write from the defender's perspective. Focus on detection, prevention, and response: 'monitor for X', 'implement Y control', 'respond by...'. Be specific and operational."
    )

    employees = context.get('employees', 'not specified')
    tech_stack = context.get('tech_stack', 'not specified')
    exposed_services = context.get('exposed_services', 'not specified')

    prompt = f"""You are a {role} writing a detailed, company-specific attack playbook.

COMPANY: {company_name}
KNOWN INTEL:
- Key personnel: {employees}
- Tech stack: {tech_stack}
- Exposed services: {exposed_services}

SCENARIO: {scenario.get('title')} (type: {scenario.get('type')})
MITRE TECHNIQUE: {scenario.get('mitre_technique')}
DESCRIPTION: {scenario.get('description')}
LIKELIHOOD: {scenario.get('likelihood')} | IMPACT: {scenario.get('impact')}

Write a structured playbook with EXACTLY these 6 sections in order, each starting with "## " followed by the heading name:

## Reconnaissance
## Initial Contact
## Execution
## Impact
## Detection Indicators
## Mitigations

Rules:
- Be specific to this company's actual intel - reference real names, real technologies, real services
- Each section MUST contain at least 4 specific, actionable items - never generic advice
- Reference the actual company name, actual employee names/roles, actual technologies/services listed above
- For Initial Contact in ATK mode: write the FULL draft message or call script verbatim, not just a description of one
- Name real tools (Maltego, theHarvester, Gophish, Metasploit, SET, Burp Suite) and real techniques where applicable
- DEF mode: specify concrete detection rules (which log sources, what to alert on), not just "monitor for suspicious activity"
- {framing}

/no_think"""

    async with httpx.AsyncClient() as client:
        model = await get_available_model(client)
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": f"You are a {role}. Write structured, specific playbooks using real intel provided. Always use exactly the 6 section headings specified."},
                {"role": "user", "content": prompt},
            ],
            "stream": True,
            "think": False,
            "options": {"temperature": 0.3, "num_predict": 3072},
        }

        async with client.stream(
            "POST",
            f"{OLLAMA_URL}/api/chat",
            json=payload,
            timeout=httpx.Timeout(connect=10.0, read=300.0, write=10.0, pool=10.0),
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if await _check():
                    raise CancelledError()
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield ("token", content)
                    if chunk.get("done"):
                        break
                except json.JSONDecodeError:
                    continue


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
