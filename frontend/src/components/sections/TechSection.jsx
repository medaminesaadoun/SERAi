export default function TechSection({ data, setData }) {
  const fields = [
    {
      key: 'public_tech_stack',
      label: 'Publicly Known Tech Stack',
      placeholder: 'e.g. React, Node.js, AWS, PostgreSQL (from job postings, BuiltWith, Wappalyzer)',
      rows: 2,
    },
    {
      key: 'job_posting_tools',
      label: 'Tools Revealed in Job Postings',
      placeholder: 'e.g. Salesforce, Jira, Terraform, Kubernetes, Splunk',
      rows: 2,
    },
    {
      key: 'exposed_services',
      label: 'Exposed Services / Portals',
      placeholder: 'e.g. VPN login page (Cisco AnyConnect), HR portal (Workday), exposed Jenkins, Grafana...',
      rows: 2,
    },
    {
      key: 'cloud_providers',
      label: 'Cloud Providers (if known)',
      placeholder: 'e.g. AWS (S3 bucket found), Azure AD (login redirect), GCP',
      rows: 1,
    },
    {
      key: 'frameworks_visible',
      label: 'Frameworks / Libraries Visible',
      placeholder: 'e.g. Detected via headers, error pages, HTML comments, robots.txt',
      rows: 2,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 02</div>
        <h2 className="text-xl font-bold text-white">Technologie</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Document the technology surface visible from outside the organization.
        </p>
      </div>

      {fields.map(({ key, label, placeholder, rows }) => (
        <div key={key}>
          <label className="serai-label">{label}</label>
          <textarea
            className="serai-input resize-none"
            rows={rows}
            placeholder={placeholder}
            value={data[key]}
            onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
          />
        </div>
      ))}
    </div>
  )
}
