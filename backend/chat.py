"""AI chat follow-up for analyses.

Streams a contextually-aware response from Ollama given the full analysis,
the company form, prior chat history, and a new user question.
"""
import httpx
from database import get_chat_history
from llm import get_available_chat_model, OLLAMA_URL


CHAT_SYSTEM_PROMPT = """You are SERAi Assistant, a senior security consultant embedded in the SERAi
(Social Engineering Risk Analyzer) tool. You have the full context of one specific
analysis the user just ran: the company name, the OSINT form, and the AI-generated
risk assessment (scores, priority targets, attack scenarios, recommendations, MITRE
techniques, executive summary).

Your job: answer follow-up questions precisely, referencing real details from the
analysis. Be specific, technical when needed, but concise. Use Markdown formatting
(bold, bullet lists, short code blocks for log/command snippets) when it helps
clarity. Do not repeat the full analysis back. Do not output JSON. If the user
asks something outside the analysis scope, acknowledge it briefly and redirect.
"""


def build_chat_messages(
    company_name: str,
    form_data: dict,
    analysis_result: dict,
    history: list[dict],
    user_message: str,
    mode: str = "attack",
    max_history: int = 12,
) -> list[dict]:
    """Compose the messages list for the Ollama /api/chat call."""
    ds = analysis_result.get("dimension_scores", {}) or {}
    targets = analysis_result.get("priority_targets", []) or []
    scenarios = analysis_result.get("attack_scenarios", []) or []
    recs = analysis_result.get("recommendations", []) or []

    context_block = f"""COMPANY: {company_name}
GLOBAL SCORE: {analysis_result.get('global_score')}/100 ({analysis_result.get('risk_level')})
DIMENSION SCORES: People {ds.get('people')} · Technology {ds.get('technology')} · Processes {ds.get('processes')} · Digital Footprint {ds.get('digital_footprint')}

EXECUTIVE SUMMARY:
{analysis_result.get('executive_summary', '')}

PRIORITY TARGETS ({len(targets)}):
""" + "\n".join(
        f"- {t.get('name')} ({t.get('role')}, risk: {t.get('risk_level')})" for t in targets
    ) + f"""

ATTACK SCENARIOS ({len(scenarios)}):
""" + "\n".join(
        f"- {s.get('title')} [{s.get('mitre_technique')}] - likelihood {s.get('likelihood')}, impact {s.get('impact')}"
        for s in scenarios
    ) + f"""

RECOMMENDATIONS ({len(recs)}):
""" + "\n".join(
        f"- P{rec.get('priority')}: {rec.get('title')} [{rec.get('mitre_mitigation')}]"
        for rec in recs
    )

    framing = (
        "The user is in ATTACK mode - prefer red-team framing: how would an attacker exploit, "
        "what tools, what indicators of compromise, what payload would be used."
        if mode == "attack"
        else "The user is in DEFENSE mode - prefer blue-team framing: how to detect, mitigate, "
             "respond, what controls to add, what alerts to write."
    )

    system_content = (
        f"{CHAT_SYSTEM_PROMPT}\n\nCurrent mode: {framing}\n\n"
        f"=== ANALYSIS CONTEXT (reference only, do not regurgitate) ===\n{context_block}"
    )

    messages: list[dict] = [{"role": "system", "content": system_content}]

    trimmed = history[-max_history:] if history else []
    for msg in trimmed:
        role = msg.get("role")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})
    return messages


async def stream_chat_response(
    company_name: str,
    form_data: dict,
    analysis_result: dict,
    history: list[dict],
    user_message: str,
    mode: str = "attack",
    is_cancelled=None,
):
    """Async generator yielding ('token', str) chunks from Ollama chat completion.

    ``is_cancelled`` is an optional async/sync callable returning True when the
    client has disconnected. Raises :class:`tasks.CancelledError` mid-stream.
    """
    import asyncio
    from tasks import CancelledError

    async def _check():
        if is_cancelled is None:
            return False
        if asyncio.iscoroutinefunction(is_cancelled):
            return await is_cancelled()
        return bool(is_cancelled())

    messages = build_chat_messages(
        company_name=company_name,
        form_data=form_data,
        analysis_result=analysis_result,
        history=history,
        user_message=user_message,
        mode=mode,
    )

    async with httpx.AsyncClient() as client:
        model = await get_available_chat_model(client)
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "think": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 1024,
            },
        }
        async with client.stream(
            "POST",
            f"{OLLAMA_URL}/api/chat",
            json=payload,
            timeout=httpx.Timeout(connect=10.0, read=180.0, write=10.0, pool=10.0),
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if await _check():
                    raise CancelledError()
                if not line.strip():
                    continue
                try:
                    import json
                    chunk = json.loads(line)
                except Exception:
                    continue
                content = chunk.get("message", {}).get("content", "")
                if content:
                    yield ("token", content)
                if chunk.get("done"):
                    break
