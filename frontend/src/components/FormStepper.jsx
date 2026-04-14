import { useState } from 'react'
import axios from 'axios'
import PeopleSection from './sections/PeopleSection'
import TechSection from './sections/TechSection'
import ProcessSection from './sections/ProcessSection'
import DigitalFootprintSection from './sections/DigitalFootprintSection'

const STEPS = [
  { id: 0, key: 'people',           label: 'Personnes',         icon: '👤' },
  { id: 1, key: 'technology',       label: 'Technologie',       icon: '⚙️' },
  { id: 2, key: 'processes',        label: 'Processus',         icon: '🔄' },
  { id: 3, key: 'digital_footprint',label: 'Empreinte Digitale',icon: '🌐' },
  { id: 4, key: 'submit',           label: 'Analyse',           icon: '▶' },
]

const defaultPeople = {
  employees: [],
  org_chart_exposed: false,
  org_chart_details: '',
  total_employees_approx: '',
}
const defaultTech = {
  public_tech_stack: '',
  job_posting_tools: '',
  exposed_services: '',
  cloud_providers: '',
  frameworks_visible: '',
}
const defaultProcesses = {
  ticketing_system_visible: false,
  ticketing_system_name: '',
  onboarding_docs_public: false,
  vendor_relationships: '',
  internal_process_leaks: '',
}
const defaultDigitalFootprint = {
  social_media_presence: '',
  website_info: '',
  news_mentions: '',
  github_repos: '',
  pastebin_leaks: '',
  other_exposure: '',
}

export default function FormStepper({ onComplete }) {
  const [step, setStep] = useState(0)
  const [companyName, setCompanyName] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [people, setPeople] = useState(defaultPeople)
  const [technology, setTechnology] = useState(defaultTech)
  const [processes, setProcesses] = useState(defaultProcesses)
  const [digitalFootprint, setDigitalFootprint] = useState(defaultDigitalFootprint)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!companyName.trim()) { setError('Company name is required.'); return }
    if (!authorized) { setError('You must confirm authorized testing before submitting.'); return }

    setLoading(true)
    setError('')
    try {
      const payload = {
        company_name: companyName,
        authorized,
        people,
        technology,
        processes,
        digital_footprint: digitalFootprint,
      }
      const res = await axios.post('/api/analyze', payload, { timeout: 180000 })
      onComplete(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Analysis failed. Is Ollama running?')
    } finally {
      setLoading(false)
    }
  }

  const sectionProps = [
    { data: people, setData: setPeople },
    { data: technology, setData: setTechnology },
    { data: processes, setData: setProcesses },
    { data: digitalFootprint, setData: setDigitalFootprint },
  ]

  const SectionComponents = [PeopleSection, TechSection, ProcessSection, DigitalFootprintSection]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Company name header */}
      <div className="mb-8">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2">
          // Target Organization
        </div>
        <input
          className="serai-input text-lg font-semibold"
          placeholder="Enter company / organization name"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => { if (i < step || i === step) return; if (i <= step + 1) setStep(i) }}
              className={`flex items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-wider
                transition-colors whitespace-nowrap
                ${i === step
                  ? 'text-accent border-b-2 border-accent'
                  : i < step
                    ? 'text-neutral-400 border-b border-border'
                    : 'text-neutral-700 border-b border-transparent'
                }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {i < step && <span className="text-accent ml-1">✓</span>}
            </button>
            {i < STEPS.length - 1 && (
              <span className="text-border font-mono mx-1">›</span>
            )}
          </div>
        ))}
      </div>

      {/* Section content */}
      <div className="serai-card p-6 mb-6">
        {step < 4 && (() => {
          const Comp = SectionComponents[step]
          const { data, setData } = sectionProps[step]
          return <Comp data={data} setData={setData} />
        })()}

        {step === 4 && (
          <div>
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-4">
              // Authorization & Submission
            </div>
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-[#111] border border-border p-4 text-sm text-neutral-400 space-y-1">
                <div className="text-neutral-200 font-semibold mb-2">Analysis Summary</div>
                <div>Target: <span className="text-accent font-mono">{companyName || '—'}</span></div>
                <div>People identified: <span className="text-neutral-300">{people.employees.length}</span></div>
                <div>Tech stack: <span className="text-neutral-300">{technology.public_tech_stack || '—'}</span></div>
                <div>Exposed services: <span className="text-neutral-300">{technology.exposed_services || '—'}</span></div>
              </div>

              {/* Authorization checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={e => setAuthorized(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-accent cursor-pointer"
                />
                <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  I confirm that I am authorized to perform this security assessment on the target organization.
                  This analysis is conducted for legitimate security testing purposes only, and I have explicit
                  written permission from the organization's management. I understand that unauthorized security
                  testing may be illegal.
                </span>
              </label>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 font-mono text-sm">
                  ✗ {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="serai-btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="serai-btn-primary"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !authorized || !companyName.trim()}
            className="serai-btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analyzing...
              </>
            ) : (
              '▶ Run Analysis'
            )}
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-4 text-center font-mono text-xs text-neutral-500">
          <div className="mb-1 text-accent">Querying local LLM — this may take 30-90 seconds…</div>
          <div className="w-full bg-border h-px overflow-hidden">
            <div className="h-px bg-accent animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  )
}
