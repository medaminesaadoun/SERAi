export const DEMO_ANALYSIS = {
  id: 'demo-0000-0000-0000',
  timestamp: new Date().toISOString(),
  company_name: 'Acme Technologies',
  _isDemo: true,
  result: {
    global_score: 74,
    risk_level: 'HIGH',
    executive_summary:
      'Acme Technologies presents a HIGH overall social engineering risk profile. The organization has significant people-layer exposure stemming from a heavily LinkedIn-indexed org chart, multiple senior executives with rich public profiles, and several recent job postings that inadvertently disclose internal tooling (Jira, Confluence, GitHub Enterprise, AWS). The technology footprint is largely reconstructible from open-source intelligence: CloudFront distributions, Datadog RUM snippets, and a Next.js/Node stack are all fingerprint-visible. Process leakage is moderate — public onboarding references and a Notion workspace with open sharing settings expose operational detail. Immediate priorities should be LinkedIn exposure reduction, job-post sanitization, and a phishing simulation programme targeting the finance and HR teams.',

    dimension_scores: {
      people: 82,
      technology: 68,
      processes: 55,
      digital_footprint: 71,
    },

    priority_targets: [
      {
        name: 'Sarah Mitchell',
        role: 'Chief Financial Officer',
        risk_level: 'CRITICAL',
        attack_vectors: ['Spear-phishing', 'Pretexting', 'BEC / wire fraud'],
        protection: 'Enforce dual-approval on wire transfers; enrol in executive phishing simulation; restrict public LinkedIn activity.',
      },
      {
        name: 'Daniel Okonkwo',
        role: 'Head of DevOps',
        risk_level: 'HIGH',
        attack_vectors: ['Vishing', 'GitHub repo targeting', 'Credential stuffing'],
        protection: 'Audit public GitHub repos for secrets; enforce hardware MFA on all cloud console access.',
      },
      {
        name: 'HR / Recruiting Team',
        role: 'Department (6 members)',
        risk_level: 'HIGH',
        attack_vectors: ['Fake candidate résumés', 'LinkedIn impersonation', 'Malicious file uploads'],
        protection: 'Sandbox all inbound attachments; brief team on candidate impersonation tactics.',
      },
      {
        name: 'Lucas Ferretti',
        role: 'Senior Cloud Architect',
        risk_level: 'MEDIUM',
        attack_vectors: ['LinkedIn phishing', 'Conference social engineering'],
        protection: 'Limit public disclosure of internal cloud topology; use a professional alias at public events.',
      },
    ],

    attack_scenarios: [
      {
        title: 'CFO Business Email Compromise',
        type: 'Spear-Phishing',
        description:
          "Adversary harvests Sarah Mitchell's public LinkedIn profile, recent conference talks, and quoted press releases to craft a highly contextualised email spoofing the CEO. The email requests an urgent wire transfer under a fabricated M&A NDA, exploiting the CFO's known travel schedule to create time pressure.",
        likelihood: 'HIGH',
        impact: 'HIGH',
        mitre_technique: 'T1566.002 — Spearphishing Link',
      },
      {
        title: 'DevOps Credential Harvesting via Fake Job Portal',
        type: 'Pretexting',
        description:
          "Attacker creates a convincing clone of a well-known engineering job board and sends Daniel Okonkwo a personalised 'exclusive opportunity' email. The fake portal requests GitHub OAuth login to 'review your public projects', silently capturing his OAuth token for lateral movement into CI/CD pipelines.",
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        mitre_technique: 'T1078 — Valid Accounts',
      },
      {
        title: 'Malicious PDF via Fake Candidate Application',
        type: 'Phishing',
        description:
          'A threat actor submits a job application to the HR team containing a PDF résumé with an embedded JavaScript payload that exploits an unpatched Acrobat Reader vulnerability. Upon opening, it establishes a reverse shell on the recruiter\'s workstation, pivoting to internal HR systems.',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        mitre_technique: 'T1204.002 — Malicious File',
      },
      {
        title: 'AWS Credential Exposure via Public GitHub Repo',
        type: 'OSINT / Exposure',
        description:
          "A scan of Acme's public GitHub organisation reveals a legacy infrastructure-as-code repo containing an AWS access key committed 14 months ago. Although never rotated, the key retains EC2 DescribeInstances and S3 ListBuckets permissions — enough to enumerate cloud topology for a follow-on attack.",
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        mitre_technique: 'T1552.001 — Credentials In Files',
      },
    ],

    recommendations: [
      {
        priority: 1,
        title: 'Sanitize Job Postings of Internal Tooling References',
        description:
          'Audit all active and historic job postings to remove explicit mentions of internal platforms (Jira, Datadog, GitHub Enterprise, Confluence). Replace with generic equivalents ("issue tracker", "observability platform"). Establish a pre-publication review checklist for recruitment.',
        mitre_mitigation: 'M1013 — Application Developer Guidance',
      },
      {
        priority: 2,
        title: 'Launch Executive Spear-Phishing Simulation Programme',
        description:
          'Enrol the C-suite, finance, and HR teams in a quarterly phishing simulation using contextualised lures drawn from public OSINT (LinkedIn posts, press releases). Track click-through rates and provide immediate targeted training to those who fail.',
        mitre_mitigation: 'M1017 — User Training',
      },
      {
        priority: 3,
        title: 'Implement Hardware MFA Across All Privileged Accounts',
        description:
          'Mandate FIDO2/WebAuthn hardware keys (YubiKey or equivalent) for all cloud console, GitHub, and Okta admin accounts. SMS and TOTP are insufficient against real-time phishing proxies.',
        mitre_mitigation: 'M1032 — Multi-factor Authentication',
      },
      {
        priority: 4,
        title: 'Rotate and Vault All Cloud Credentials',
        description:
          'Run a full secrets scan across all public and private repositories using GitHub Advanced Security or truffleHog. Rotate any exposed keys immediately and migrate to short-lived credential issuance via AWS IAM Identity Center.',
        mitre_mitigation: 'M1027 — Password Policies',
      },
      {
        priority: 5,
        title: 'Reduce LinkedIn Org-Chart Exposure',
        description:
          "Work with People Ops to coach employees on limiting role-specific detail in LinkedIn bios (avoid listing internal tools, project codenames, or reporting lines). Consider a policy requiring approval before publishing architecture or security-adjacent roles publicly.",
        mitre_mitigation: 'M1056 — Pre-compromise',
      },
    ],
  },
}
