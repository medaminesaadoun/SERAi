# SERAi — Social Engineering Risk Analyzer

> **LOCAL-ONLY** cybersecurity tool that takes structured OSINT data about an organization and produces a social engineering risk assessment, with a local LLM, MITRE ATT&CK alignment, and full privacy. **No data ever leaves your machine.**

---

## What SERAi does

SERAi is a single-page web application that helps red teams, blue teams, and security consultants self-assess an organization's exposure to social engineering attacks. You fill in a 4-section OSINT questionnaire (People, Technology, Processes, Digital Footprint), and a local LLM generates:

- A **global risk score** (0–100) and a level (LOW / MEDIUM / HIGH / CRITICAL)
- **Per-dimension scores** (People, Technology, Processes, Digital Footprint)
- A list of **priority targets** (high-value individuals with attack vectors)
- **Attack scenarios** mapped to MITRE ATT&CK techniques and tactics
- **Prioritized recommendations** with MITRE mitigations
- An **executive summary** in plain language
- A **kill-chain diagram** showing how the attack scenarios chain together
- **Per-scenario playbooks** (red team and blue team perspectives)
- An **AI chat** to ask follow-up questions about the analysis
- A **comparison tile** comparing to your previous analysis of the same company
- A **downloadable PDF report**

All inference runs on your machine through Ollama. No cloud calls, no telemetry, no external dependencies at runtime.

---

## Major features

| # | Feature | What it does |
|---|---|---|
| 1 | **4-section OSINT form** | Guided input for People, Technology, Processes, Digital Footprint |
| 2 | **Local LLM analysis** | Structured JSON output with risk scores, targets, scenarios, recommendations |
| 3 | **MITRE ATT&CK alignment** | Every attack scenario is mapped to a technique (Txxxx) and a tactic (TAxxxx) |
| 4 | **Kill-chain diagram** | Interactive horizontal flow with play sequence, animated particles, MITRE tactic columns |
| 5 | **AI chat** | Context-aware follow-up questions with ATK/DEF mode toggle |
| 6 | **Per-scenario playbooks** | 6-section streamed playbooks (Reconnaissance, Initial Contact, Execution, Impact, Detection, Mitigations) |
| 7 | **Global AI activity bar** | Tracks all running AI operations; cancel from anywhere; background stream toasts |
| 8 | **Task progress + cancel + partial save** | Real-time task events; cancel mid-stream; save partial output as draft |
| 9 | **Analysis cache** | SHA-256 keyed cache: same form + same model = instant hit, ~90% rate on re-runs |
| 10 | **Company profiles** | Save and reload OSINT profiles for repeat assessments |
| 11 | **Split-model architecture** | Qwen 3.5 4B for analysis, Qwen 3 Instruct 4B for chat — optimal for each workload |
| 12 | **History + drafts** | Browse all past analyses; restore drafts of cancelled runs (7-day retention) |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | For local dev |
| Python | 3.12+ | For local dev |
| Docker + Docker Compose | Latest | Optional, for containerized run |
| Ollama | Latest | Must run on the **host** machine |
| RAM | 8 GB min, 16 GB recommended | For running both 4B models simultaneously |
| Disk | 5 GB free | For Ollama models |

---

## 1. Install & Start Ollama

```bash
# Install Ollama (https://ollama.com)

# Pull the two models SERAi uses (split-model architecture):
ollama pull qwen3.5:4b          # Analysis model (reasoning)
ollama pull qwen3:4b-instruct   # Chat model (fast, no thinking mode)

# Optional fallback:
ollama pull llama3.1:8b

# Verify Ollama is running:
ollama list
curl http://localhost:11434/api/tags
```

> Ollama must be running on your host machine at `http://localhost:11434` before starting SERAi.

The ModelSelector in the SERAi header lets you switch between installed models at runtime. The available models list is restricted to the supported ones (`qwen3.5:4b` and `qwen3:4b-instruct`) for a curated experience.

---

## 2. Run Locally (Dev Mode)

### Backend

```bash
cd backend
python 3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`.

---

## Architecture

SERAi is a three-tier local application:

```
Analyst's browser (React SPA)
       │
       │ HTTP/REST + Server-Sent Events
       ▼
FastAPI backend (Python)
   ├── analysis cache (SHA-256, LRU 200)
   ├── analysis_drafts table (7-day TTL)
   ├── chat_messages table
   ├── TaskEmitter (SSE task events)
   ├── usePlaybookStream registry (module-level)
       │
       │ HTTP (local)
       ▼
Ollama (local LLM runtime)
   ├── qwen3.5:4b         (analysis: reasoning, JSON output)
   └── qwen3:4b-instruct  (chat: fast, no thinking mode)
```

### Split-model rationale

| Workload | Model | Why |
|---|---|---|
| Full analysis (5–20s) | `qwen3.5:4b` | Reasoning capability produces higher-quality JSON output with `mitre_tactic` populated correctly |
| Chat follow-ups (1–3s) | `qwen3:4b-instruct` | Chat-tuned, no thinking mode (Qwen 3.5 wastes 50% of tokens on thinking), instant responses |

If either model is missing, SERAi automatically falls back to the other with a warning log.

### Analysis dimensions

| Dimension | What it covers |
|---|---|
| **People** | Employee exposure, org chart, LinkedIn visibility, email format patterns |
| **Technology** | Public tech stack, job posting leaks, exposed services, cloud providers, frameworks |
| **Processes** | Ticketing systems, onboarding docs, vendor relationships, internal process leaks |
| **Digital Footprint** | Social media, website, news mentions, public GitHub repos, pastebin leaks |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Ollama connection, installed models, active model, chat model availability |
| `/api/analyze` | POST | Submit form data, run LLM analysis (blocking) |
| `/api/analyze/stream` | POST | SSE streaming analysis with task events |
| `/api/analyses` | GET | List all saved analyses |
| `/api/analyses/{id}` | GET | Retrieve a specific analysis |
| `/api/analyses/{id}` | DELETE | Delete an analysis |
| `/api/analyses/{id}/comparison` | GET | AI comparison vs. previous analysis of same company |
| `/api/analyses/{id}/report` | GET | HTML report (printable, has "Save as PDF" button) |
| `/api/analyses/{id}/pdf` | GET | WeasyPrint PDF report (dark theme, CONFIDENTIEL watermark) |
| `/api/analyses/{id}/chat` | GET | Chat history (returns empty if analysis not in DB; context fallback) |
| `/api/analyses/{id}/chat` | DELETE | Clear chat history |
| `/api/analyses/{id}/chat/stream` | POST | SSE streaming chat with full analysis context |
| `/api/scenarios/playbook/stream` | POST | SSE streaming playbook (6 sections, ATK/DEF mode) |
| `/api/models` | GET | List installed Ollama models |
| `/api/settings/model` | POST | Set active analysis model |
| `/api/mitre/tactics` | GET | List 14 MITRE ATT&CK tactics |
| `/api/profiles` | GET/POST | List or save company profiles |
| `/api/profiles/{id}` | GET/PUT/DELETE | Profile CRUD |
| `/api/drafts` | POST | Save a partial analysis (from cancelled run) |
| `/api/drafts/{id}` | GET | Retrieve a draft |
| `/api/companies/{name}/drafts` | GET | List drafts for a company |
| `/api/drafts/{id}` | DELETE | Delete a draft |
| `/api/cache/stats` | GET | Cache statistics (size, hit rate, oldest/newest) |
| `/api/cache` | DELETE | Clear the cache |

Interactive docs: `http://localhost:8000/docs`

---

## Output

Each analysis produces:

- **Global risk score** (0–100) and **risk level** (LOW / MEDIUM / HIGH / CRITICAL)
- **Per-dimension scores** with visual bars
- **Priority targets** with attack vectors and mitigations
- **Attack scenarios** (5–7) mapped to MITRE ATT&CK techniques AND tactics
- **Kill-chain diagram** (interactive, with Play Sequence animation)
- **Per-scenario playbooks** (ATK and DEF modes, 6 sections)
- **Prioritized recommendations** with MITRE mitigations
- **Executive summary** in plain language
- **AI chat** for follow-up questions (context-aware)
- **Comparison tile** (if you have a previous analysis of the same company)
- **Downloadable PDF report** (WeasyPrint, dark theme, CONFIDENTIEL watermark)

---

## Project Structure

```
SerAIV2/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Dashboard.jsx                 # Bento-grid results view
│   │   │   ├── FormStepper.jsx               # 4-step OSINT input form
│   │   │   ├── ChatPanel.jsx                 # AI chat drawer (420px)
│   │   │   ├── ChatMessage.jsx               # Block-level markdown renderer
│   │   │   ├── ChatInput.jsx                 # Auto-resize textarea
│   │   │   ├── ChatLauncher.jsx              # Floating bottom-left button
│   │   │   ├── PlaybookDrawer.jsx            # Background-streamed playbook
│   │   │   ├── ModelSelector.jsx             # Rich card popover, filtered models
│   │   │   ├── AnalysisHistory.jsx           # Past analyses with cancelled/draft badges
│   │   │   ├── AnalysisLoader.jsx            # Load a past analysis
│   │   │   ├── AuthorizationModal.jsx        # 8-second confirmation gate
│   │   │   ├── LandingPage.jsx               # Hero/intro screen
│   │   │   ├── RadarChart.jsx                # SVG radar for risk scores
│   │   │   ├── TaskProgress.jsx              # Animated task list with cancel
│   │   │   ├── PartialSaveDialog.jsx         # Copy/Keep/Discard on cancel
│   │   │   ├── CacheBadge.jsx                # Cache hit/miss indicator (⚡ cached vs ⏱ fresh)
│   │   │   ├── AIActivityBar.jsx             # Global AI progress (sticky top bar)
│   │   │   ├── BackgroundStreamToasts.jsx     # Persistent background toasts
│   │   │   ├── StreamAIBridge.jsx             # Bridges streams ↔ AI store
│   │   │   ├── OutdatedWarning.jsx           # "Outdated analysis" banner
│   │   │   ├── ThemeSwitcher.jsx             # 3 themes (glass/cyber/stealth)
│   │   │   ├── OnboardingTooltip.jsx          # First-run guidance
│   │   │   ├── Toaster.jsx                   # Toast queue
│   │   │   ├── sections/                     # Form sub-components
│   │   │   │   ├── PeopleSection.jsx
│   │   │   │   ├── TechSection.jsx
│   │   │   │   ├── ProcessSection.jsx
│   │   │   │   ├── DigitalFootprintSection.jsx
│   │   │   │   └── FormHelpers.jsx
│   │   │   └── killchain/                    # Kill-chain diagram
│   │   │       ├── KillChainDiagram.jsx
│   │   │       ├── KillChainStage.jsx
│   │   │       ├── KillChainNode.jsx
│   │   │       ├── KillChainConnector.jsx
│   │   │       ├── KillChainControls.jsx
│   │   │       └── KillChainLegend.jsx
│   │   ├── context/
│   │   │   ├── AIStoreContext.jsx            # Global AI ops + request channel
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js                    # SSE chat consumer
│   │   │   ├── usePlaybookStream.js          # Module-level stream registry
│   │   │   ├── useTaskStream.js              # (legacy, replaced by direct integration)
│   │   │   ├── useProfileDiff.js             # Highlight changes vs saved profile
│   │   │   ├── useDraft.js                   # localStorage draft persistence
│   │   │   └── useKillChainMapping.js        # Group scenarios by MITRE tactic
│   │   └── data/
│   │       ├── demoAnalysis.js              # Acme Technologies demo result
│   │       ├── sampleFills.js                # Randomized OSINT example profiles
│   │       ├── mitreTactics.js               # 14 MITRE tactics with icons/colors
│   │       └── suggestedQuestions.js         # Chat suggested questions (ATK/DEF)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/
│   ├── main.py                               # FastAPI routes (~700 lines)
│   ├── llm.py                                # Ollama integration + split-model
│   ├── models.py                             # Pydantic schemas
│   ├── database.py                           # SQLite (aiosqlite) CRUD
│   ├── cache.py                              # SHA-256 + LRU cache manager
│   ├── chat.py                               # AI chat streaming
│   ├── tasks.py                              # TaskEmitter for SSE task events
│   ├── mitre_tactics.py                      # 200+ technique → tactic mappings
│   ├── pdf_generator.py                      # WeasyPrint + Jinja2
│   ├── templates/report.html                 # PDF template
│   ├── seed_demo.py                          # 6 demo analyses
│   ├── backfill_tactics.py                   # One-time migration script
│   ├── requirements.txt
│   └── Dockerfile
├── rapport/                                 # LaTeX academic report
│   ├── main.tex
│   ├── preamble.sty
│   ├── chapters/                            # 11 chapter files
│   ├── figures/
│   ├── references.bib
│   ├── Makefile
│   └── README.md
├── docker-compose.yml
├── start-dev.sh
├── README.md
├── HANDOVER.md

```

---

## Ethical Use Disclaimer

**SERAi is strictly for authorized security assessments.**

- You **must** have explicit written authorization from the target organization before conducting any assessment
- The authorization checkbox in the UI is a legal acknowledgement, not a formality
- Unauthorized security testing may violate computer crime laws in your jurisdiction
- The authors assume no liability for misuse of this tool
- All analysis data is stored locally only: no telemetry, no cloud sync, no external calls (except to your local Ollama instance)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Cannot reach Ollama" | Ensure `ollama serve` is running, check port 11434 |
| Model not found | Run `ollama pull qwen3.5:4b` and `ollama pull qwen3:4b-instruct` |
| Analysis times out | Use a smaller model; the Qwen 3.5 4B is already optimized |
| Chat returns empty | The chat model may not be loaded yet — wait 30s for first load |
| Stale uvicorn (changes not applied) | Kill old `python.exe` processes, restart with `uvicorn main:app --reload` |
| AI bar shows "0 operations" when streaming | Backend is stale — restart it (the task events need the latest code) |
| Kill-chain empty | Run a new analysis; old analyses (pre-2025) don't have `mitre_tactic` populated |
| PDF generation fails | WeasyPrint needs system fonts; check Docker logs |
| CORS errors | Backend must be on port 8000; frontend on 3000 |

---

## License

For authorized security assessments only. See Ethical Use Disclaimer above.
