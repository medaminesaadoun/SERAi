import { useState, useRef } from 'react'
import AnalysisLoader from './AnalysisLoader'
import PeopleSection from './sections/PeopleSection'
import TechSection from './sections/TechSection'
import ProcessSection from './sections/ProcessSection'
import DigitalFootprintSection from './sections/DigitalFootprintSection'
import { ConsentTooltip } from './OnboardingTooltip'
import { useToast } from '../context/ToastContext'

const STEPS = [
  { id: 0, label: 'Personnes',          sublabel: 'People & org exposure'   },
  { id: 1, label: 'Technologie',         sublabel: 'Tech stack & services'   },
  { id: 2, label: 'Processus',           sublabel: 'Internal workflows'       },
  { id: 3, label: 'Empreinte Digitale',  sublabel: 'Digital footprint'        },
]

const SectionComponents = [PeopleSection, TechSection, ProcessSection, DigitalFootprintSection]

const defaultPeople          = { employees: [], org_chart_exposed: false, org_chart_details: '', total_employees_approx: '' }
const defaultTech            = { public_tech_stack: '', job_posting_tools: '', exposed_services: '', cloud_providers: '', frameworks_visible: '' }
const defaultProcesses       = { ticketing_system_visible: false, ticketing_system_name: '', onboarding_docs_public: false, vendor_relationships: '', internal_process_leaks: '' }
const defaultDigitalFootprint = { social_media_presence: '', website_info: '', news_mentions: '', github_repos: '', pastebin_leaks: '', other_exposure: '' }

export default function FormStepper({ onComplete }) {
  const [step, setStep]           = useState(0)
  const [slideClass, setSlideClass] = useState('slide-from-right')
  const prevStep                  = useRef(0)

  const [companyName, setCompanyName]   = useState('')
  const [authorized, setAuthorized]     = useState(false)
  const [people, setPeople]             = useState(defaultPeople)
  const [technology, setTechnology]     = useState(defaultTech)
  const [processes, setProcesses]       = useState(defaultProcesses)
  const [digitalFootprint, setDigital]  = useState(defaultDigitalFootprint)

  const [loading, setLoading]           = useState(false)
  const [streamEvent, setStreamEvent]   = useState(null)
  const { toast } = useToast()

  const sectionData = [
    { data: people,          setData: setPeople },
    { data: technology,      setData: setTechnology },
    { data: processes,       setData: setProcesses },
    { data: digitalFootprint,setData: setDigital },
  ]

  function goTo(next) {
    setSlideClass(next > prevStep.current ? 'slide-from-right' : 'slide-from-left')
    prevStep.current = next
    setStep(next)
  }

  async function handleSubmit() {
    if (!companyName.trim()) { toast.warning('Company name is required.'); return }
    if (!authorized) { toast.warning('You must confirm authorization before submitting.'); return }
    setLoading(true)
    setStreamEvent(null)
    try {
      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          authorized,
          people,
          technology,
          processes,
          digital_footprint: digitalFootprint,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            setStreamEvent(event)
            if (event.type === 'done') {
              toast.success('Analysis complete!')
              onComplete(event.analysis)
              return
            }
            if (event.type === 'error') throw new Error(event.message)
          } catch (_) { /* skip malformed lines */ }
        }
      }
    } catch (e) {
      toast.error(e.message || 'Analysis failed. Is Ollama running?', 7000)
    } finally {
      setLoading(false)
    }
  }

  const isSubmitStep = step === 4

  if (loading) return <AnalysisLoader company={companyName} streamEvent={streamEvent} />

  return (
    <div className="max-w-2xl mx-auto">

      {/* Company name */}
      <div className="mb-8 fade-in-up">
        <label className="serai-label">Target Organization</label>
        <input
          className="serai-input text-base font-semibold"
          placeholder="Enter company / organization name"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
        />
      </div>

      {/* Step indicator */}
      {/* Mobile: compact progress bar + label */}
      <div className="sm:hidden mb-8 fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-accent">
            Step {isSubmitStep ? STEPS.length + 1 : step + 1} of {STEPS.length + 1}
          </span>
          <span className="font-mono text-xs text-neutral-500">
            {isSubmitStep ? 'Review' : STEPS[step]?.label}
          </span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${((isSubmitStep ? STEPS.length : step) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: circles + connecting line */}
      <div className="hidden sm:flex items-start mb-10 fade-in-up" style={{ animationDelay: '0.05s' }}>
        {STEPS.map((s, i) => {
          const done   = i < step
          const active = i === step && !isSubmitStep

          return (
            <div key={s.id} className="flex items-start flex-1">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <button
                  onClick={() => done && goTo(i)}
                  disabled={!done}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center
                    font-mono font-bold text-sm transition-all duration-300
                    ${done
                      ? 'border-accent bg-accent text-bg cursor-pointer hover:scale-110'
                      : active
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-border text-neutral-600 cursor-default'
                    }`}
                  style={active
                    ? { boxShadow: '0 0 18px rgb(var(--color-accent) / 0.4)' }
                    : done
                      ? { boxShadow: '0 0 10px rgb(var(--color-accent) / 0.3)' }
                      : undefined}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </button>
                <span className={`text-xs font-mono text-center leading-tight transition-colors duration-300 hidden md:block
                  ${active ? 'text-accent' : done ? 'text-neutral-400' : 'text-neutral-700'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 relative mt-4 mx-1">
                  <div className="h-px bg-border w-full" />
                  <div className="absolute top-0 left-0 h-px bg-accent transition-all duration-500 ease-out"
                       style={{ width: done ? '100%' : '0%' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Section card */}
      <div className="serai-card p-6 mb-6" style={{ animationDelay: '0.1s' }}>
        {!isSubmitStep ? (
          <div key={step} className={slideClass}>
            {(() => {
              const Comp = SectionComponents[step]
              const { data, setData } = sectionData[step]
              return <Comp data={data} setData={setData} />
            })()}
          </div>
        ) : (
          <div key="submit" className="slide-from-right space-y-5">
            <div>
              <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">
                // Authorization & Review
              </div>
              <h2 className="text-xl font-bold">Ready to Analyze</h2>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Target',           companyName || '—'],
                ['Employees added',  people.employees.length],
                ['Tech stack',       technology.public_tech_stack || '—'],
                ['Exposed services', technology.exposed_services || '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-black/20 border border-border/50 rounded px-3 py-2">
                  <div className="text-xs text-neutral-600 font-mono mb-0.5">{label}</div>
                  <div className="text-sm text-neutral-300 font-medium truncate">{String(val)}</div>
                </div>
              ))}
            </div>

            {/* Auth checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group p-4 rounded border border-border/50 bg-black/10 hover:border-accent/30 transition-colors">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={e => setAuthorized(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                  ${authorized ? 'bg-accent border-accent' : 'border-border'}`}>
                  {authorized && (
                    <svg className="w-3 h-3 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed flex-1">
                I confirm I am <strong className="text-neutral-200">authorized</strong> to perform this security
                assessment. This is for legitimate security testing with explicit written permission from the
                organization's management.
              </span>
              <ConsentTooltip />
            </label>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center fade-in-up" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => isSubmitStep ? goTo(3) : goTo(step - 1)}
          disabled={step === 0 && !isSubmitStep}
          className="serai-btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        {!isSubmitStep ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-600">{step + 1} / {STEPS.length}</span>
            <button onClick={() => goTo(step < STEPS.length - 1 ? step + 1 : 4)} className="serai-btn-primary">
              {step === STEPS.length - 1 ? 'Review →' : 'Next →'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !authorized || !companyName.trim()}
            className="serai-btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analyzing…
              </>
            ) : '▶ Run Analysis'}
          </button>
        )}
      </div>

    </div>
  )
}
