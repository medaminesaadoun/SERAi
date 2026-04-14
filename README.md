# SERAi — Social Engineering Risk Analyzer

> **LOCAL-ONLY** cybersecurity tool for assessing an organization's social engineering attack surface using public OSINT data and a local LLM. **No data ever leaves your machine.**

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | For local dev |
| Python | 3.11+ | For local dev |
| Docker + Docker Compose | Latest | For containerized run |
| Ollama | Latest | Must run on the **host** machine |

---

## 1. Install & Start Ollama

```bash
# Install Ollama (https://ollama.com)
# Then pull the required model:
ollama pull qwen3.5:4b

# Optional fallback model:
ollama pull llama3.1:8b

# Verify Ollama is running:
ollama list
```

> Ollama must be running on your host machine at `http://localhost:11434` before starting SERAi.

---

## 2. Run with Docker (Recommended)

```bash
# From the project root:
docker-compose up --build

# Then open:
#   Frontend:  http://localhost:3000
#   API docs:  http://localhost:8000/docs
```

> **Note:** Ollama runs on your host, not inside Docker. The backend connects to it via `host.docker.internal:11434`.

---

## 3. Run Locally (Dev Mode)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
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

```
Analyst → React Form (4 sections)
        → POST /api/analyze (FastAPI)
        → Ollama (qwen3.5:4b) @ localhost:11434
        → JSON structured response
        → SQLite persistence
        → Results Dashboard + PDF export
```

### Analysis Dimensions

| Dimension | What it covers |
|---|---|
| **People** | Employee exposure, org chart, LinkedIn visibility |
| **Technology** | Public tech stack, job posting leaks, exposed services |
| **Processes** | Ticketing systems, onboarding docs, vendor relationships |
| **Digital Footprint** | Social media, GitHub, news mentions, leak sites |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Check Ollama connection status |
| `/api/analyze` | POST | Submit form data, run LLM analysis |
| `/api/analyses` | GET | List all past analyses |
| `/api/analyses/{id}` | GET | Retrieve specific analysis |
| `/api/analyses/{id}/pdf` | GET | Generate & download PDF report |

Interactive docs: `http://localhost:8000/docs`

---

## Output

Each analysis produces:
- **Global risk score** (0–100)
- **Risk level** (LOW / MEDIUM / HIGH / CRITICAL)
- **Dimension scores** (People, Technology, Processes, Digital Footprint)
- **Priority targets** with attack vectors and mitigations
- **Attack scenarios** mapped to MITRE ATT&CK techniques
- **Prioritized recommendations** with MITRE mitigations
- **Executive summary** (non-technical)
- **Downloadable PDF report** (WeasyPrint, dark theme, CONFIDENTIEL watermark)

---

## Project Structure

```
serai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FormStepper.jsx          # 4-step input wizard
│   │   │   ├── sections/
│   │   │   │   ├── PeopleSection.jsx
│   │   │   │   ├── TechSection.jsx
│   │   │   │   ├── ProcessSection.jsx
│   │   │   │   └── DigitalFootprintSection.jsx
│   │   │   ├── Dashboard.jsx            # Results display
│   │   │   ├── RadarChart.jsx           # Chart.js radar
│   │   │   └── AnalysisHistory.jsx      # Past analyses
│   │   └── App.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── main.py                          # FastAPI routes
│   ├── models.py                        # Pydantic schemas
│   ├── llm.py                           # Ollama integration + retry logic
│   ├── database.py                      # SQLite (aiosqlite)
│   ├── pdf_generator.py                 # WeasyPrint + Jinja2
│   ├── templates/report.html            # PDF template
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Ethical Use Disclaimer

**SERAi is strictly for authorized security assessments.**

- You **must** have explicit written authorization from the target organization before conducting any assessment
- The authorization checkbox in the UI is a legal acknowledgement, not a formality
- Unauthorized security testing may violate computer crime laws in your jurisdiction
- The authors assume no liability for misuse of this tool
- All analysis data is stored locally only — no telemetry, no cloud sync, no external calls (except to your local Ollama instance)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Cannot reach Ollama" | Ensure `ollama serve` is running, check port 11434 |
| Model not found | Run `ollama pull qwen3.5:4b` |
| Analysis times out | Increase Docker memory limit; smaller models are faster |
| PDF generation fails | WeasyPrint needs system fonts; check Docker logs |
| CORS errors | Backend must be on port 8000; frontend on 3000 |
