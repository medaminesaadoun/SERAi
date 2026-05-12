import { FieldGroup, FieldHint, SectionProgress, OsintResources, AutoTextarea } from './FormHelpers'

const OSINT_TOOLS = [
  { name: 'Glassdoor',  url: 'https://glassdoor.com',         desc: 'Interview process leaks, internal tool mentions' },
  { name: 'Google Dorks',url: 'https://google.com',           desc: 'site:notion.so "company", site:confluence.atlassian.net "company"' },
  { name: 'Wayback Machine', url: 'https://web.archive.org',  desc: 'Archived internal pages, old portals' },
  { name: 'LinkedIn',   url: 'https://linkedin.com',          desc: 'Employee posts often reveal processes & vendors' },
  { name: 'Indeed',     url: 'https://indeed.com',            desc: 'Job descriptions list internal workflows' },
  { name: 'Crunchbase', url: 'https://crunchbase.com',        desc: 'Partner and investor relationships' },
]

export default function ProcessSection({ data, setData }) {
  const progressValues = [
    data.ticketing_system_visible,
    data.onboarding_docs_public,
    data.vendor_relationships,
    data.internal_process_leaks,
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 03</div>
          <h2 className="text-xl font-bold text-white">Process Leakage</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Identify internal processes and workflows inadvertently disclosed publicly.
          </p>
        </div>
        <SectionProgress values={progressValues} />
      </div>

      {/* Ticketing system */}
      <div className="border border-border/60 p-4 space-y-3 rounded-sm">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ticketing"
            checked={data.ticketing_system_visible}
            onChange={e => setData(d => ({ ...d, ticketing_system_visible: e.target.checked }))}
            className="accent-accent"
          />
          <label htmlFor="ticketing" className="text-sm text-neutral-300 cursor-pointer font-medium">
            Ticketing / issue-tracking system publicly visible
          </label>
        </div>
        <FieldHint always>Google: <em>"[company name]" site:jira.atlassian.com</em> or check if their GitHub Issues or ServiceNow portal is open. Shodan often indexes Jira instances.</FieldHint>
        {data.ticketing_system_visible && (
          <FieldGroup>
            <label className="serai-label">System Name &amp; Details</label>
            <input
              className="serai-input"
              placeholder="e.g. Jira (public board at company.atlassian.net), GitHub Issues (public repo)"
              value={data.ticketing_system_name}
              onChange={e => setData(d => ({ ...d, ticketing_system_name: e.target.value }))}
            />
          </FieldGroup>
        )}
      </div>

      {/* Onboarding docs */}
      <div className="border border-border/60 p-4 space-y-3 rounded-sm">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="onboarding"
            checked={data.onboarding_docs_public}
            onChange={e => setData(d => ({ ...d, onboarding_docs_public: e.target.checked }))}
            className="accent-accent"
          />
          <label htmlFor="onboarding" className="text-sm text-neutral-300 cursor-pointer font-medium">
            Onboarding / internal documentation found publicly
          </label>
        </div>
        <FieldHint always>
          Try Google dorks: <em>site:notion.so "[company]"</em>, <em>site:confluence.atlassian.net "[company]"</em>. Glassdoor interview reviews often describe internal processes in detail.
        </FieldHint>
      </div>

      {/* Vendor relationships + Process leaks - side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FieldGroup>
          <label className="serai-label">Known Vendor / Partner Relationships</label>
          <AutoTextarea
            className="serai-input"
            minRows={3}
            placeholder="e.g. AWS Premier Partner, uses Salesforce (named in press release), Microsoft Gold Partner…"
            value={data.vendor_relationships}
            onChange={e => setData(d => ({ ...d, vendor_relationships: e.target.value }))}
          />
          <FieldHint>Check the company blog and press releases. LinkedIn posts by employees often tag vendors. Crunchbase lists investors and strategic partners.</FieldHint>
        </FieldGroup>

        <FieldGroup>
          <label className="serai-label">Other Internal Process Leaks</label>
          <AutoTextarea
            className="serai-input"
            minRows={3}
            placeholder="e.g. Approval workflows described in public blog posts, interview questions on Glassdoor reveal security procedures, supply chain partners named in annual reports…"
            value={data.internal_process_leaks}
            onChange={e => setData(d => ({ ...d, internal_process_leaks: e.target.value }))}
          />
          <FieldHint>The Wayback Machine archives old internal pages. Employee LinkedIn posts and conference talks are rich sources of inadvertent process disclosure.</FieldHint>
        </FieldGroup>
      </div>

      <OsintResources tools={OSINT_TOOLS} />
    </div>
  )
}
