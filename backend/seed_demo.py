"""
Seed demo data: 6 analyses for "Acme Technologies" showing security improvement over ~4 months.
Run once before demo: python seed_demo.py
"""
import asyncio
import json
import uuid
from datetime import timezone
from pathlib import Path
import aiosqlite

DB_PATH = Path(__file__).parent / "serai.db"

ACME_FORM = {
    "company_name": "Acme Technologies",
    "authorized": True,
    "people": {
        "employees": [
            {"name": "James Harrington", "role": "CEO", "linkedin_visible": True, "email_format": "firstname.lastname@acmetech.io"},
            {"name": "Priya Mehta", "role": "CTO", "linkedin_visible": True, "email_format": "firstname.lastname@acmetech.io"},
            {"name": "Daniel Okonkwo", "role": "Lead DevOps", "linkedin_visible": True, "email_format": ""},
        ],
        "org_chart_exposed": True,
        "org_chart_details": "Full org chart visible on company website",
        "total_employees_approx": "120"
    },
    "technology": {
        "public_tech_stack": "React, Node.js, MongoDB, nginx, Redis",
        "job_posting_tools": "Jira, Confluence, GitHub Actions, Datadog",
        "exposed_services": "VPN login portal, Jira service desk (public-facing), legacy FTP server",
        "cloud_providers": "AWS",
        "frameworks_visible": "Express.js, Mongoose, React Query"
    },
    "processes": {
        "ticketing_system_visible": True,
        "ticketing_system_name": "Jira",
        "onboarding_docs_public": True,
        "vendor_relationships": "Salesforce, Stripe, SendGrid, Twilio",
        "internal_process_leaks": "Employee handbook indexed by Google, onboarding checklist on Confluence"
    },
    "digital_footprint": {
        "social_media_presence": "Active LinkedIn company page, Twitter/X account, 3 employees posting work updates publicly",
        "website_info": "WordPress 6.1, hosted on AWS us-east-1, WHOIS public, SSL cert reveals subdomains",
        "news_mentions": "TechCrunch article from 2023, local business press mentions",
        "github_repos": "Public GitHub org with 12 repos, one contains .env.example with prod-like values",
        "pastebin_leaks": "Old API key found on Pastebin (rotated but URL still accessible)",
        "other_exposure": "Job postings reveal internal tool names, salary band structure visible on Glassdoor"
    }
}

RUNS = [
    {
        "date": "2026-01-15T09:00:00+00:00",
        "global_score": 84, "risk_level": "CRITICAL",
        "people": 88, "technology": 79, "processes": 91, "digital_footprint": 82,
        "targets": [
            {"name": "James Harrington", "role": "CEO", "risk_level": "MAX",
             "attack_vectors": ["Spear phishing", "LinkedIn impersonation", "BEC"], "protection": "No visible MFA indicators"},
            {"name": "Priya Mehta", "role": "CTO", "risk_level": "HIGH",
             "attack_vectors": ["Technical pretexting", "GitHub account targeting"], "protection": "Limited public exposure"},
        ],
        "scenarios": [
            {"title": "CEO Spear Phishing Campaign", "type": "phishing", "mitre_technique": "T1566",
             "description": "Highly targeted email impersonating board member using harvested LinkedIn data",
             "likelihood": "HIGH", "impact": "HIGH"},
            {"title": "Jira Service Desk Social Engineering", "type": "pretexting", "mitre_technique": "T1534",
             "description": "Attacker poses as vendor to extract credentials via public Jira portal",
             "likelihood": "HIGH", "impact": "MEDIUM"},
        ],
        "recommendations": [
            {"priority": 1, "title": "Enforce MFA across all accounts", "description": "Implement hardware or app-based MFA for all employees, prioritizing executives and DevOps team.", "mitre_mitigation": "M1032"},
            {"priority": 2, "title": "Remove public org chart", "description": "Restrict organizational chart visibility to authenticated employees only.", "mitre_mitigation": "M1017"},
            {"priority": 3, "title": "Patch legacy FTP server", "description": "Decommission or firewall the exposed FTP server immediately.", "mitre_mitigation": "M1030"},
        ],
        "summary": "Acme Technologies presents a critical social engineering risk profile. The combination of a fully exposed org chart, multiple LinkedIn-visible executives, and a public-facing Jira instance creates an ideal target environment. Immediate action on MFA and access controls is essential."
    },
    {
        "date": "2026-02-02T10:30:00+00:00",
        "global_score": 78, "risk_level": "HIGH",
        "people": 85, "technology": 68, "processes": 84, "digital_footprint": 76,
        "targets": [
            {"name": "James Harrington", "role": "CEO", "risk_level": "MAX",
             "attack_vectors": ["Spear phishing", "BEC"], "protection": "MFA now enforced"},
            {"name": "Daniel Okonkwo", "role": "Lead DevOps", "risk_level": "HIGH",
             "attack_vectors": ["GitHub targeting", "Technical pretexting"], "protection": "Limited"},
        ],
        "scenarios": [
            {"title": "Executive BEC Attack", "type": "BEC", "mitre_technique": "T1534",
             "description": "Business Email Compromise targeting CFO using CEO identity", "likelihood": "HIGH", "impact": "HIGH"},
            {"title": "DevOps Credential Harvesting", "type": "phishing", "mitre_technique": "T1598",
             "description": "Targeted phishing via fake GitHub security alert", "likelihood": "MEDIUM", "impact": "HIGH"},
        ],
        "recommendations": [
            {"priority": 1, "title": "Security awareness training", "description": "Mandatory phishing simulation and awareness training for all staff, quarterly.", "mitre_mitigation": "M1017"},
            {"priority": 2, "title": "Remove onboarding docs from public web", "description": "Revoke public indexing of Confluence onboarding materials.", "mitre_mitigation": "M1018"},
        ],
        "summary": "Progress noted since January - MFA has been implemented and the FTP server decommissioned. However, the people dimension remains critically high with executives still heavily exposed on social media. Process leaks via public Confluence continue to pose significant risk."
    },
    {
        "date": "2026-02-28T14:00:00+00:00",
        "global_score": 72, "risk_level": "HIGH",
        "people": 80, "technology": 61, "processes": 71, "digital_footprint": 75,
        "targets": [
            {"name": "James Harrington", "role": "CEO", "risk_level": "HIGH",
             "attack_vectors": ["Spear phishing", "Vishing"], "protection": "MFA enforced, reduced LinkedIn activity"},
            {"name": "Priya Mehta", "role": "CTO", "risk_level": "HIGH",
             "attack_vectors": ["Technical pretexting"], "protection": "GitHub activity reduced"},
        ],
        "scenarios": [
            {"title": "Vishing Attack on Helpdesk", "type": "vishing", "mitre_technique": "T1566",
             "description": "Attacker calls IT helpdesk impersonating executive to reset credentials", "likelihood": "MEDIUM", "impact": "HIGH"},
        ],
        "recommendations": [
            {"priority": 1, "title": "Implement helpdesk identity verification protocol", "description": "Require out-of-band verification for all credential reset requests.", "mitre_mitigation": "M1017"},
            {"priority": 2, "title": "Rotate exposed GitHub secrets", "description": "Audit all public repositories for exposed credentials and rotate immediately.", "mitre_mitigation": "M1047"},
        ],
        "summary": "Continued improvement in technology and process dimensions. The Confluence onboarding docs have been restricted and tech stack exposure reduced. People risk remains elevated due to executive social media presence, and a new helpdesk impersonation vector has been identified."
    },
    {
        "date": "2026-03-20T09:15:00+00:00",
        "global_score": 67, "risk_level": "HIGH",
        "people": 75, "technology": 55, "processes": 63, "digital_footprint": 71,
        "targets": [
            {"name": "James Harrington", "role": "CEO", "risk_level": "HIGH",
             "attack_vectors": ["Spear phishing"], "protection": "Active monitoring"},
        ],
        "scenarios": [
            {"title": "Supplier Impersonation", "type": "pretexting", "mitre_technique": "T1585",
             "description": "Attacker impersonates Stripe or Salesforce support to extract API credentials", "likelihood": "MEDIUM", "impact": "HIGH"},
        ],
        "recommendations": [
            {"priority": 1, "title": "Vendor communication verification", "description": "Establish verified communication channels with key vendors Stripe, Salesforce.", "mitre_mitigation": "M1017"},
            {"priority": 2, "title": "Reduce executive social media footprint", "description": "Implement executive digital footprint reduction policy.", "mitre_mitigation": "M1056"},
        ],
        "summary": "Acme Technologies continues its security improvement trajectory. Technology risk has dropped significantly following infrastructure hardening. The primary residual risks are now concentrated in the people dimension and vendor relationship exposure."
    },
    {
        "date": "2026-04-10T11:00:00+00:00",
        "global_score": 58, "risk_level": "MEDIUM",
        "people": 71, "technology": 48, "processes": 54, "digital_footprint": 60,
        "targets": [
            {"name": "James Harrington", "role": "CEO", "risk_level": "MEDIUM",
             "attack_vectors": ["Spear phishing"], "protection": "Security-aware, trained"},
        ],
        "scenarios": [
            {"title": "Targeted LinkedIn Campaign", "type": "phishing", "mitre_technique": "T1566",
             "description": "Multi-stage LinkedIn connection then phishing attack targeting mid-level managers", "likelihood": "MEDIUM", "impact": "MEDIUM"},
        ],
        "recommendations": [
            {"priority": 1, "title": "Advanced phishing simulation", "description": "Run quarterly red team phishing exercises targeting LinkedIn-active employees.", "mitre_mitigation": "M1017"},
        ],
        "summary": "Risk profile has improved substantially to MEDIUM level. Technology and process controls are now robust. The main remaining exposure is through LinkedIn-active employees, particularly at the executive level. Continued security awareness training is the priority."
    },
    {
        "date": "2026-05-01T08:30:00+00:00",
        "global_score": 49, "risk_level": "MEDIUM",
        "people": 66, "technology": 42, "processes": 45, "digital_footprint": 52,
        "targets": [
            {"name": "James Harrington", "role": "CEO", "risk_level": "MEDIUM",
             "attack_vectors": ["Spear phishing"], "protection": "Trained, low social media activity"},
        ],
        "scenarios": [
            {"title": "Seasonal Phishing Campaign", "type": "phishing", "mitre_technique": "T1566",
             "description": "Opportunistic phishing exploiting remaining LinkedIn exposure during high-activity periods", "likelihood": "LOW", "impact": "MEDIUM"},
        ],
        "recommendations": [
            {"priority": 1, "title": "Maintain security culture", "description": "Sustain quarterly phishing simulations and security awareness program.", "mitre_mitigation": "M1017"},
            {"priority": 2, "title": "Zero-trust network access", "description": "Implement ZTNA to reduce blast radius of any successful social engineering attempt.", "mitre_mitigation": "M1030"},
        ],
        "summary": "Acme Technologies has reduced its social engineering risk profile from CRITICAL to MEDIUM over 4 months. Technology and process controls are mature. People risk remains the primary vector but has been significantly reduced through training and reduced digital footprint."
    },
]


async def seed():
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if already seeded
        async with db.execute("SELECT COUNT(*) FROM analyses WHERE company_name = 'Acme Technologies'") as cur:
            count = (await cur.fetchone())[0]
        if count >= 6:
            print("Already seeded - Acme Technologies has", count, "analyses. Delete them first to re-seed.")
            return

        for run in RUNS:
            analysis_result = {
                "global_score": run["global_score"],
                "risk_level": run["risk_level"],
                "dimension_scores": {
                    "people": run["people"],
                    "technology": run["technology"],
                    "processes": run["processes"],
                    "digital_footprint": run["digital_footprint"],
                },
                "priority_targets": run["targets"],
                "attack_scenarios": run["scenarios"],
                "recommendations": run["recommendations"],
                "executive_summary": run["summary"],
            }
            analysis_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO analyses (id, timestamp, company_name, form_data, analysis_result, pdf_path) VALUES (?, ?, ?, ?, ?, ?)",
                (analysis_id, run["date"], "Acme Technologies", json.dumps(ACME_FORM), json.dumps(analysis_result), None),
            )
            print(f"Inserted: {run['date'][:10]} - Score {run['global_score']} ({run['risk_level']})")

        await db.commit()
        print("Done. 6 Acme Technologies analyses seeded.")


asyncio.run(seed())
