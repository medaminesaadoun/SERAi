from pydantic import BaseModel

# ── Form input models ──────────────────────────────────────────────────────────

class Employee(BaseModel):
    name: str
    role: str
    linkedin_visible: bool = False
    email_format: str = ""  # e.g. "firstname.lastname@company.com"


class PeopleData(BaseModel):
    employees: list[Employee] = []
    org_chart_exposed: bool = False
    org_chart_details: str = ""
    total_employees_approx: str = ""


class TechData(BaseModel):
    public_tech_stack: str = ""       # comma-separated or free text
    job_posting_tools: str = ""       # tools revealed in job ads
    exposed_services: str = ""        # e.g. exposed portals, login pages
    cloud_providers: str = ""
    frameworks_visible: str = ""


class ProcessData(BaseModel):
    ticketing_system_visible: bool = False
    ticketing_system_name: str = ""
    onboarding_docs_public: bool = False
    vendor_relationships: str = ""    # known vendors / partners
    internal_process_leaks: str = ""  # anything else visible


class DigitalFootprintData(BaseModel):
    social_media_presence: str = ""   # platforms and activity level
    website_info: str = ""            # tech, whois, hosting
    news_mentions: str = ""
    github_repos: str = ""            # public repos, any sensitive findings
    pastebin_leaks: str = ""
    other_exposure: str = ""


class AnalysisRequest(BaseModel):
    company_name: str
    authorized: bool                  # consent checkbox — must be True
    people: PeopleData
    technology: TechData
    processes: ProcessData
    digital_footprint: DigitalFootprintData


# ── LLM output models ─────────────────────────────────────────────────────────

class PriorityTarget(BaseModel):
    name: str
    role: str
    risk_level: str
    attack_vectors: list[str]
    protection: str


class AttackScenario(BaseModel):
    title: str
    type: str
    mitre_technique: str
    description: str
    likelihood: str
    impact: str


class Recommendation(BaseModel):
    priority: int
    title: str
    description: str
    mitre_mitigation: str


class DimensionScores(BaseModel):
    people: int
    technology: int
    processes: int
    digital_footprint: int


class AnalysisResult(BaseModel):
    global_score: int
    risk_level: str
    dimension_scores: DimensionScores
    priority_targets: list[PriorityTarget]
    attack_scenarios: list[AttackScenario]
    recommendations: list[Recommendation]
    executive_summary: str


# ── API response models ───────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    id: str
    timestamp: str
    company_name: str
    result: AnalysisResult


class AnalysisSummary(BaseModel):
    id: str
    timestamp: str
    company_name: str
    global_score: int | None
    risk_level: str | None


class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    model: str
    message: str
