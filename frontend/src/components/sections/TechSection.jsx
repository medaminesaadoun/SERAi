import { FieldGroup, FieldHint, SectionProgress, OsintResources, AutoTextarea } from './FormHelpers'

const OSINT_TOOLS = [
  { name: 'BuiltWith',    url: 'https://builtwith.com',         desc: 'Full tech stack from any domain' },
  { name: 'Wappalyzer',   url: 'https://wappalyzer.com',        desc: 'Browser extension - real-time stack detection' },
  { name: 'Shodan',       url: 'https://shodan.io',             desc: 'Exposed services, ports, banners' },
  { name: 'Censys',       url: 'https://search.censys.io',      desc: 'Internet-wide scanning, TLS certs' },
  { name: 'crt.sh',       url: 'https://crt.sh',                desc: 'Certificate transparency - reveals subdomains' },
  { name: 'SecurityTrails',url: 'https://securitytrails.com',   desc: 'DNS history, subdomain enumeration' },
]

const FIELDS = [
  {
    key: 'public_tech_stack',
    label: 'Publicly Known Tech Stack',
    placeholder: 'e.g. React, Node.js, AWS, PostgreSQL',
    rows: 2,
    hint: 'Use BuiltWith or the Wappalyzer extension on their website. Job postings on LinkedIn/Indeed are goldmines - search "[Company] engineer" to see required skills.',
  },
  {
    key: 'job_posting_tools',
    label: 'Tools Revealed in Job Postings',
    placeholder: 'e.g. Salesforce, Jira, Terraform, Kubernetes, Splunk',
    rows: 2,
    hint: 'Go to LinkedIn Jobs, Indeed, or Glassdoor and search the company name. Read "Requirements" sections carefully - they often list internal platforms verbatim.',
  },
  {
    key: 'exposed_services',
    label: 'Exposed Services / Portals',
    placeholder: 'e.g. VPN login (Cisco AnyConnect), HR portal (Workday), open Grafana dashboard…',
    rows: 2,
    hint: 'Search Shodan for the company domain or IP range. Try common subdomains manually: vpn., mail., gitlab., jenkins., jira., confluence. Check crt.sh for subdomain enumeration.',
  },
  {
    key: 'cloud_providers',
    label: 'Cloud Providers (if known)',
    placeholder: 'e.g. AWS (S3 bucket found), Azure AD (login redirect), GCP',
    rows: 1,
    hint: 'Azure AD reveals itself via login.microsoftonline.com redirects. AWS S3 URLs contain the region. GCP buckets follow storage.googleapis.com patterns. BuiltWith also flags CDN/cloud providers.',
  },
  {
    key: 'frameworks_visible',
    label: 'Frameworks / Libraries Visible',
    placeholder: 'e.g. Next.js (via X-Powered-By header), jQuery 3.6 (HTML source), Nginx (Server header)…',
    rows: 2,
    hint: 'Open browser DevTools → Network tab → inspect response headers. Check HTML source for script tags. Look at error pages - they often expose framework versions. robots.txt and sitemap.xml reveal CMS structure.',
  },
]

export default function TechSection({ data, setData, changedFields = new Set(), sectionKey = 'technology' }) {
  const progressValues = FIELDS.map(f => data[f.key])
  const changed = (field) => changedFields.has(`${sectionKey}.${field}`)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 02</div>
          <h2 className="text-xl font-bold text-white">Technology Footprint</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Document the technology surface visible from outside the organization.
          </p>
        </div>
        <SectionProgress values={progressValues} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {FIELDS.slice(0, 4).map(({ key, label, placeholder, rows, hint }) => (
          <FieldGroup key={key}>
            <label className="serai-label">
              {label}
              {changed(key) && <span className="ml-2 text-blue-400 text-xs font-mono">● updated</span>}
            </label>
            <AutoTextarea
              className={`serai-input${changed(key) ? ' ring-2 ring-blue-500/60' : ''}`}
              minRows={rows}
              placeholder={placeholder}
              value={data[key]}
              onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
            />
            <FieldHint>{hint}</FieldHint>
          </FieldGroup>
        ))}
        <div className="lg:col-span-2">
          <FieldGroup>
            <label className="serai-label">
              {FIELDS[4].label}
              {changed(FIELDS[4].key) && <span className="ml-2 text-blue-400 text-xs font-mono">● updated</span>}
            </label>
            <AutoTextarea
              className={`serai-input${changed(FIELDS[4].key) ? ' ring-2 ring-blue-500/60' : ''}`}
              minRows={FIELDS[4].rows}
              placeholder={FIELDS[4].placeholder}
              value={data[FIELDS[4].key]}
              onChange={e => setData(d => ({ ...d, [FIELDS[4].key]: e.target.value }))}
            />
            <FieldHint>{FIELDS[4].hint}</FieldHint>
          </FieldGroup>
        </div>
      </div>

      <OsintResources tools={OSINT_TOOLS} />
    </div>
  )
}
