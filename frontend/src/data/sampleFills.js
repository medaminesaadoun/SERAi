// Realistic OSINT profiles for quick-fill demo purposes.
// Each represents a different industry / risk posture.

export const SAMPLE_PROFILES = [
  {
    company_name: 'Nexum Financial',
    people: {
      employees: [
        { name: 'Sarah Chen',      role: 'Chief Financial Officer',    linkedin_visible: true,  email_format: 'firstname.lastname@nexumfinancial.com' },
        { name: 'Marcus Webb',     role: 'Head of IT Security',        linkedin_visible: true,  email_format: 'firstname.lastname@nexumfinancial.com' },
        { name: 'Diana Okonkwo',   role: 'Senior Software Engineer',   linkedin_visible: false, email_format: '' },
      ],
      org_chart_exposed: true,
      org_chart_details: 'Full org chart visible on company website under "About Us" section',
      total_employees_approx: '320',
    },
    technology: {
      public_tech_stack: 'React, Node.js, PostgreSQL, AWS',
      job_posting_tools: 'Terraform, Kubernetes, Datadog, PagerDuty, Okta',
      exposed_services: 'Jira instance (jira.nexumfinancial.com), Confluence wiki, Salesforce login portal',
      cloud_providers: 'AWS (eu-west-1)',
      frameworks_visible: 'Spring Boot mentioned in job listings, Kafka for event streaming',
    },
    processes: {
      ticketing_system_visible: true,
      ticketing_system_name: 'Jira (publicly accessible login)',
      onboarding_docs_public: false,
      vendor_relationships: 'Stripe (payments), Twilio (SMS OTP), KPMG (auditor)',
      internal_process_leaks: 'Glassdoor reviews mention weekly all-hands on Mondays at 9am GMT',
    },
    digital_footprint: {
      social_media_presence: 'Active LinkedIn (company + employees), Twitter/X for announcements',
      website_info: 'WordPress with Cloudflare, WHOIS privacy enabled, hosted on AWS',
      news_mentions: 'TechCrunch article on Series B (March 2024), FT piece on expansion',
      github_repos: '3 public repos — one contains commented-out staging API keys (now removed)',
      pastebin_leaks: 'None found',
      other_exposure: 'Job postings mention "internal Slack workspace" and "weekly incident reviews in Confluence"',
    },
  },

  {
    company_name: 'Orion Logistics Group',
    people: {
      employees: [
        { name: 'James Hartley',   role: 'Operations Director',        linkedin_visible: true,  email_format: 'j.hartley@orionlogistics.co.uk' },
        { name: 'Priya Suresh',    role: 'Procurement Manager',        linkedin_visible: true,  email_format: 'p.suresh@orionlogistics.co.uk' },
        { name: 'Tom Brandt',      role: 'IT Systems Administrator',   linkedin_visible: false, email_format: '' },
      ],
      org_chart_exposed: false,
      org_chart_details: '',
      total_employees_approx: '1 200',
    },
    technology: {
      public_tech_stack: 'SAP ERP, Oracle DB',
      job_posting_tools: 'SAP S/4HANA, Power BI, Microsoft Azure, ServiceNow',
      exposed_services: 'VPN login portal (vpn.orionlogistics.co.uk), ServiceNow self-service portal',
      cloud_providers: 'Microsoft Azure',
      frameworks_visible: '.NET mentioned in dev job postings',
    },
    processes: {
      ticketing_system_visible: true,
      ticketing_system_name: 'ServiceNow (public-facing self-service portal)',
      onboarding_docs_public: true,
      vendor_relationships: 'DHL (last-mile partner), Maersk (freight), Deloitte (consulting)',
      internal_process_leaks: 'Onboarding PDF indexed by Google reveals VPN setup steps and IT helpdesk email',
    },
    digital_footprint: {
      social_media_presence: 'LinkedIn company page, inactive Twitter',
      website_info: 'Static site on IIS/Windows Server, WHOIS shows registrar data, Shodan exposes RDP on a subdomain',
      news_mentions: 'Local press coverage of warehouse expansion (Jan 2025)',
      github_repos: 'None public',
      pastebin_leaks: 'Internal IP range (10.12.x.x/16) mentioned in a 2023 paste',
      other_exposure: 'Shodan: RDP port 3389 open on logistics.orionlogistics.co.uk',
    },
  },

  {
    company_name: 'ClearMind Health',
    people: {
      employees: [
        { name: 'Dr. Amara Diallo', role: 'Chief Medical Officer',    linkedin_visible: true,  email_format: 'a.diallo@clearmindhealth.com' },
        { name: 'Kevin Park',       role: 'CISO',                     linkedin_visible: true,  email_format: 'k.park@clearmindhealth.com' },
        { name: 'Rachel Torres',    role: 'Patient Services Manager',  linkedin_visible: true,  email_format: 'r.torres@clearmindhealth.com' },
        { name: 'Liam Foster',      role: 'Junior Developer',         linkedin_visible: false, email_format: '' },
      ],
      org_chart_exposed: false,
      org_chart_details: '',
      total_employees_approx: '85',
    },
    technology: {
      public_tech_stack: 'Python, Django, PostgreSQL, Google Cloud',
      job_posting_tools: 'Celery, Redis, Docker, dbt, BigQuery',
      exposed_services: 'Patient portal login (app.clearmindhealth.com), Zendesk help center',
      cloud_providers: 'Google Cloud Platform (us-central1)',
      frameworks_visible: 'Django REST Framework in GitHub profile',
    },
    processes: {
      ticketing_system_visible: false,
      ticketing_system_name: '',
      onboarding_docs_public: false,
      vendor_relationships: 'AWS (backup storage), Twilio (appointment reminders), Epic Systems (EHR)',
      internal_process_leaks: 'Blog post by engineer mentions daily standups and sprint cadence; references internal "dashboard" URL structure',
    },
    digital_footprint: {
      social_media_presence: 'LinkedIn, Instagram (patient testimonials), Facebook',
      website_info: 'Vercel frontend, GCP backend, SSL by Let\'s Encrypt',
      news_mentions: 'Health Tech Magazine feature (June 2024), NHS digital pilot partnership announcement',
      github_repos: '2 public repos — Django boilerplate with settings.py referencing SECRET_KEY env var; no secrets exposed',
      pastebin_leaks: 'None found',
      other_exposure: 'Glassdoor reviews reveal on-call rotation details and specific internal tool names (Retool dashboards)',
    },
  },

  {
    company_name: 'Voltex Manufacturing',
    people: {
      employees: [
        { name: 'Heinrich Braun',  role: 'Plant Manager',             linkedin_visible: false, email_format: 'h.braun@voltex-mfg.de' },
        { name: 'Claire Dupont',   role: 'Supply Chain Director',     linkedin_visible: true,  email_format: 'c.dupont@voltex-mfg.de' },
        { name: 'Ravi Nair',       role: 'IT Infrastructure Lead',    linkedin_visible: true,  email_format: 'r.nair@voltex-mfg.de' },
      ],
      org_chart_exposed: false,
      org_chart_details: '',
      total_employees_approx: '2 400',
    },
    technology: {
      public_tech_stack: 'SAP, Siemens PLC firmware',
      job_posting_tools: 'Siemens TIA Portal, AutoCAD, SCADA systems, Cisco networking',
      exposed_services: 'Remote monitoring portal (scada.voltex-mfg.de) — login page publicly reachable',
      cloud_providers: 'On-premise + Azure for Office 365',
      frameworks_visible: 'OPC-UA protocol mentioned in technical docs',
    },
    processes: {
      ticketing_system_visible: false,
      ticketing_system_name: '',
      onboarding_docs_public: false,
      vendor_relationships: 'Siemens (automation), ABB (robotics), BASF (materials), PwC (audit)',
      internal_process_leaks: 'Maintenance schedule PDF accidentally indexed — contains shift rotation times and emergency contact names',
    },
    digital_footprint: {
      social_media_presence: 'LinkedIn (corporate), Xing (German-speaking employees)',
      website_info: 'Static corporate site on Apache, hosted in Frankfurt DC, WHOIS shows direct registrant info',
      news_mentions: 'Industry press on factory expansion (Q3 2024)',
      github_repos: 'None',
      pastebin_leaks: 'Partial employee email list appeared on leak site (2022, ~40 entries)',
      other_exposure: 'SCADA login portal indexed by Shodan; firmware version visible in HTTP headers',
    },
  },

  {
    company_name: 'Stackly',
    people: {
      employees: [
        { name: 'Mia Johansson',   role: 'Co-Founder & CEO',          linkedin_visible: true,  email_format: 'mia@stackly.io' },
        { name: 'Dev Patel',       role: 'Co-Founder & CTO',          linkedin_visible: true,  email_format: 'dev@stackly.io' },
        { name: 'Zoe Nakamura',    role: 'Head of Customer Success',  linkedin_visible: true,  email_format: 'z.nakamura@stackly.io' },
      ],
      org_chart_exposed: true,
      org_chart_details: 'Team page on website lists all 28 employees with roles and photos',
      total_employees_approx: '28',
    },
    technology: {
      public_tech_stack: 'Next.js, TypeScript, Supabase, Vercel',
      job_posting_tools: 'Playwright, Vitest, Linear, Notion, Figma, Sentry, PostHog',
      exposed_services: 'Staging environment (staging.stackly.io) publicly reachable, Storybook component library (design.stackly.io)',
      cloud_providers: 'Vercel + Supabase (AWS us-east-1 under the hood)',
      frameworks_visible: 'tRPC, Prisma, Tailwind CSS visible in GitHub repos',
    },
    processes: {
      ticketing_system_visible: true,
      ticketing_system_name: 'Linear (public roadmap enabled)',
      onboarding_docs_public: false,
      vendor_relationships: 'Stripe (billing), Resend (email), Intercom (support)',
      internal_process_leaks: 'Public Linear roadmap reveals upcoming features and sprint targets; changelog exposes release cadence',
    },
    digital_footprint: {
      social_media_presence: 'Active Twitter/X (founders post frequently), LinkedIn, YouTube (demo videos)',
      website_info: 'Vercel deployment, Next.js, Cloudflare DNS, WHOIS privacy',
      news_mentions: 'Product Hunt #2 Product of the Day (Jan 2025), YC W25 batch announcement',
      github_repos: '12 public repos including main product SDK; one repo has .env.example with real Supabase project ref',
      pastebin_leaks: 'None found',
      other_exposure: 'Founder tweets include office location, team size, MRR milestones, and investor names',
    },
  },
]

export function getRandomProfile() {
  return SAMPLE_PROFILES[Math.floor(Math.random() * SAMPLE_PROFILES.length)]
}
