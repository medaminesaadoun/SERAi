export default function ProcessSection({ data, setData }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 03</div>
        <h2 className="text-xl font-bold text-white">Processus</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Identify internal processes and workflows that are inadvertently disclosed publicly.
        </p>
      </div>

      {/* Ticketing system */}
      <div className="border border-border p-4 space-y-3">
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
        {data.ticketing_system_visible && (
          <div>
            <label className="serai-label">System Name</label>
            <input
              className="serai-input"
              placeholder="e.g. Jira (public board), GitHub Issues, ServiceNow portal"
              value={data.ticketing_system_name}
              onChange={e => setData(d => ({ ...d, ticketing_system_name: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* Onboarding */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="onboarding"
          checked={data.onboarding_docs_public}
          onChange={e => setData(d => ({ ...d, onboarding_docs_public: e.target.checked }))}
          className="accent-accent"
        />
        <label htmlFor="onboarding" className="text-sm text-neutral-300 cursor-pointer font-medium">
          Onboarding / internal documentation found publicly (Confluence, Notion, Google Docs, etc.)
        </label>
      </div>

      <div>
        <label className="serai-label">Known Vendor / Partner Relationships</label>
        <textarea
          className="serai-input resize-none"
          rows={2}
          placeholder="e.g. Uses AWS MSP partner TechCorp, Microsoft Gold Partner, Salesforce ISV partner..."
          value={data.vendor_relationships}
          onChange={e => setData(d => ({ ...d, vendor_relationships: e.target.value }))}
        />
      </div>

      <div>
        <label className="serai-label">Other Internal Process Leaks</label>
        <textarea
          className="serai-input resize-none"
          rows={3}
          placeholder="e.g. Approval workflows described in public blog posts, interview process leaks on Glassdoor, supply chain partners named in press releases..."
          value={data.internal_process_leaks}
          onChange={e => setData(d => ({ ...d, internal_process_leaks: e.target.value }))}
        />
      </div>
    </div>
  )
}
