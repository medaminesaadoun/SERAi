import { useState } from 'react'
import { FieldGroup, FieldHint, SectionProgress, OsintResources } from './FormHelpers'

const OSINT_TOOLS = [
  { name: 'LinkedIn',    url: 'https://linkedin.com',              desc: 'Employee profiles, org hierarchy, job titles' },
  { name: 'Crunchbase',  url: 'https://crunchbase.com',            desc: 'Founders, executives, funding rounds' },
  { name: 'Hunter.io',   url: 'https://hunter.io',                 desc: 'Email format discovery per domain' },
  { name: 'RocketReach', url: 'https://rocketreach.co',            desc: 'Contact details for named individuals' },
  { name: 'Glassdoor',   url: 'https://glassdoor.com',             desc: 'Manager names in reviews, org hints' },
  { name: 'OSINT Ind.',  url: 'https://osintindustries.com',       desc: 'People search aggregator' },
]

function EmployeeRow({ emp, index, onChange, onRemove }) {
  return (
    <div className="bg-black/30 border border-border p-4 space-y-3 relative">
      <button
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-neutral-600 hover:text-red-400 font-mono text-xs transition-colors"
        title="Remove"
      >
        ✕
      </button>
      <div className="font-mono text-xs text-accent mb-2">Employee #{index + 1}</div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <label className="serai-label">Full Name</label>
          <input
            className="serai-input"
            placeholder="Jane Doe"
            value={emp.name}
            onChange={e => onChange(index, 'name', e.target.value)}
          />
          <FieldHint>As it appears on LinkedIn or the company website</FieldHint>
        </FieldGroup>
        <FieldGroup>
          <label className="serai-label">Role / Title</label>
          <input
            className="serai-input"
            placeholder="CTO, HR Manager…"
            value={emp.role}
            onChange={e => onChange(index, 'role', e.target.value)}
          />
          <FieldHint>Prioritise C-suite, IT, HR, and Finance — highest-value SE targets</FieldHint>
        </FieldGroup>
      </div>
      <FieldGroup>
        <label className="serai-label">Email Format (if known)</label>
        <input
          className="serai-input"
          placeholder="firstname.lastname@company.com"
          value={emp.email_format}
          onChange={e => onChange(index, 'email_format', e.target.value)}
        />
        <FieldHint>Hunter.io can infer this from the domain — enter one confirmed address as a pattern</FieldHint>
      </FieldGroup>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`li-${index}`}
          checked={emp.linkedin_visible}
          onChange={e => onChange(index, 'linkedin_visible', e.target.checked)}
          className="accent-accent"
        />
        <label htmlFor={`li-${index}`} className="text-sm text-neutral-400 cursor-pointer">
          LinkedIn profile publicly visible
        </label>
      </div>
    </div>
  )
}

export default function PeopleSection({ data, setData }) {
  const progressValues = [
    data.total_employees_approx,
    data.employees,
    data.org_chart_exposed !== false ? data.org_chart_exposed : null,
  ]

  function addEmployee() {
    setData(d => ({
      ...d,
      employees: [...d.employees, { name: '', role: '', linkedin_visible: false, email_format: '' }],
    }))
  }

  function updateEmployee(index, field, value) {
    setData(d => {
      const updated = [...d.employees]
      updated[index] = { ...updated[index], [field]: value }
      return { ...d, employees: updated }
    })
  }

  function removeEmployee(index) {
    setData(d => ({ ...d, employees: d.employees.filter((_, i) => i !== index) }))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 01</div>
          <h2 className="text-xl font-bold text-white">People &amp; Org Exposure</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Identify key employees exposed through LinkedIn, press releases, or public directories.
          </p>
        </div>
        <SectionProgress values={progressValues} />
      </div>

      {/* Headcount */}
      <FieldGroup>
        <label className="serai-label">Approximate Headcount</label>
        <input
          className="serai-input"
          placeholder="e.g. 50–100, ~500, 1,200+"
          value={data.total_employees_approx}
          onChange={e => setData(d => ({ ...d, total_employees_approx: e.target.value }))}
        />
        <FieldHint>LinkedIn "About" tab shows employee count. Crunchbase and company press releases often confirm it.</FieldHint>
      </FieldGroup>

      {/* Employees */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="serai-label mb-0">Key Employees Identified</label>
            <p className="text-xs text-neutral-500 mt-0.5">Add the individuals most likely to be targeted</p>
          </div>
          <button onClick={addEmployee} className="serai-btn-secondary text-xs py-1 px-3 shrink-0">
            + Add Employee
          </button>
        </div>

        {data.employees.length === 0 && (
          <div className="border border-dashed border-border p-6 text-center space-y-2">
            <p className="text-neutral-400 text-sm font-mono">No employees added yet.</p>
            <p className="text-xs text-neutral-500">
              Search LinkedIn for the target company and focus on C-suite, Finance, HR, and IT/Security roles.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {data.employees.map((emp, i) => (
            <EmployeeRow
              key={i}
              emp={emp}
              index={i}
              onChange={updateEmployee}
              onRemove={removeEmployee}
            />
          ))}
        </div>
      </div>

      {/* Org chart */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="org-chart"
            checked={data.org_chart_exposed}
            onChange={e => setData(d => ({ ...d, org_chart_exposed: e.target.checked }))}
            className="accent-accent"
          />
          <label htmlFor="org-chart" className="text-sm text-neutral-300 cursor-pointer font-medium">
            Org chart / hierarchy publicly exposed
          </label>
        </div>
        <FieldHint always>Check the company website "Team" or "About" page, LinkedIn company page, and Glassdoor reviews that name managers.</FieldHint>
        {data.org_chart_exposed && (
          <FieldGroup className="mt-3">
            <label className="serai-label">Details (where found, what's visible)</label>
            <textarea
              className="serai-input resize-none"
              rows={3}
              placeholder="e.g. LinkedIn shows full reporting chain under CTO; website team page includes photos and direct reports…"
              value={data.org_chart_details}
              onChange={e => setData(d => ({ ...d, org_chart_details: e.target.value }))}
            />
          </FieldGroup>
        )}
      </div>

      <OsintResources tools={OSINT_TOOLS} />
    </div>
  )
}
