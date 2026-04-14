import { useState } from 'react'

function EmployeeRow({ emp, index, onChange, onRemove }) {
  return (
    <div className="bg-[#111] border border-border p-4 space-y-3 relative">
      <button
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-neutral-600 hover:text-red-400 font-mono text-xs"
        title="Remove"
      >
        ✕
      </button>
      <div className="font-mono text-xs text-accent mb-2">Employee #{index + 1}</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="serai-label">Full Name</label>
          <input
            className="serai-input"
            placeholder="Jane Doe"
            value={emp.name}
            onChange={e => onChange(index, 'name', e.target.value)}
          />
        </div>
        <div>
          <label className="serai-label">Role / Title</label>
          <input
            className="serai-input"
            placeholder="CTO, HR Manager, etc."
            value={emp.role}
            onChange={e => onChange(index, 'role', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="serai-label">Email Format (if known)</label>
        <input
          className="serai-input"
          placeholder="firstname.lastname@company.com"
          value={emp.email_format}
          onChange={e => onChange(index, 'email_format', e.target.value)}
        />
      </div>
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
      <div>
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 01</div>
        <h2 className="text-xl font-bold text-white">Personnes</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Identify key employees exposed through LinkedIn, press releases, or public directories.
        </p>
      </div>

      <div>
        <label className="serai-label">Approximate Headcount</label>
        <input
          className="serai-input"
          placeholder="e.g. 50-100, ~500, 1200+"
          value={data.total_employees_approx}
          onChange={e => setData(d => ({ ...d, total_employees_approx: e.target.value }))}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="serai-label mb-0">Key Employees Identified</label>
          <button onClick={addEmployee} className="serai-btn-secondary text-xs py-1 px-3">
            + Add Employee
          </button>
        </div>
        {data.employees.length === 0 && (
          <div className="border border-dashed border-border p-6 text-center text-neutral-600 text-sm font-mono">
            No employees added yet. Click "+ Add Employee" to begin.
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
        {data.org_chart_exposed && (
          <div>
            <label className="serai-label">Details (where found, what's visible)</label>
            <textarea
              className="serai-input resize-none"
              rows={3}
              placeholder="e.g. LinkedIn company page shows full reporting structure, website has team page with photos..."
              value={data.org_chart_details}
              onChange={e => setData(d => ({ ...d, org_chart_details: e.target.value }))}
            />
          </div>
        )}
      </div>
    </div>
  )
}
