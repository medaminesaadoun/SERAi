import { useState, useRef } from 'react'
import AnalysisLoader from './AnalysisLoader'
import { getRandomProfile } from '../data/sampleFills'
import PeopleSection from './sections/PeopleSection'
import TechSection from './sections/TechSection'
import ProcessSection from './sections/ProcessSection'
import DigitalFootprintSection from './sections/DigitalFootprintSection'
import { ConsentTooltip } from './OnboardingTooltip'
import { useToast } from '../context/ToastContext'
import AuthorizationModal from './AuthorizationModal'

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
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { toast } = useToast()

  const sectionData = [
    { data: people,          setData: setPeople },
    { data: technology,      setData: setTechnology },
    { data: processes,       setData: setProcesses },
    { data: digitalFootprint,setData: setDigital },
  ]

  function quickFill() {
    const p = getRandomProfile()
    setCompanyName(p.company_name)
    setPeople(p.people)
    setTechnology(p.technology)
    setProcesses(p.processes)
    setDigital(p.digital_footprint)
    setStep(0)
    prevStep.current = 0
  }

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
      const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
      const url = `${base}/api/analyze/stream`
      console.log('[SSE] Connecting to', url)

      const response = await fetch(url, {
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

      console.log('[SSE] Response status', response.status, response.headers.get('content-type'))

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''
      let chunkCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) { console.log('[SSE] Stream closed'); break }

        chunkCount++
        const raw = decoder.decode(value, { stream: true })
        console.log(`[SSE] chunk #${chunkCount}:`, JSON.stringify(raw.slice(0, 120)))
        buffer += raw
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type !== 'token') console.log('[SSE] event:', event.type, event)
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
    <>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-10 items-start">

        {/* ── LEFT SIDEBAR (desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-48 shrink-0 sticky top-24">
          <div className="font-mono text-xs text-neutral-600 uppercase tracking-widest mb-6">// Analysis Form</div>

          <div className="flex flex-col">
            {STEPS.map((s, i) => {
              const done   = i < step || isSubmitStep
              const active = i === step && !isSubmitStep
              return (
                <div key={s.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => done && goTo(i)}
                      disabled={!done && !active}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                        font-mono font-bold text-xs transition-all duration-300 shrink-0
                        ${done
                          ? 'border-accent bg-accent text-bg cursor-pointer hover:scale-110'
                          : active
                            ? 'border-accent text-accent bg-accent/10 cursor-default'
                            : 'border-border text-neutral-600 cursor-default'
                        }`}
                      style={active ? { boxShadow: '0 0 14px rgb(var(--color-accent) / 0.4)' } : undefined}
                    >
                      {done ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </button>
                    <div className="w-px min-h-[2.5rem] my-1 relative">
                      <div className="absolute inset-0 bg-border" />
                      <div
                        className="absolute inset-0 bg-accent transition-all duration-500"
                        style={{ opacity: done ? 1 : 0 }}
                      />
                    </div>
                  </div>
                  <div className="pb-6 pt-1">
                    <div className={`text-sm font-medium leading-tight transition-colors duration-300
                      ${active ? 'text-accent' : done ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {s.label}
                    </div>
                    <div className="text-xs text-neutral-600 font-mono mt-0.5">{s.sublabel}</div>
                  </div>
                </div>
              )
            })}

            {/* Review step */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <button
                  disabled
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                    font-mono font-bold text-xs transition-all duration-300 shrink-0
                    ${isSubmitStep
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-neutral-600'
                    }`}
                  style={isSubmitStep ? { boxShadow: '0 0 14px rgb(var(--color-accent) / 0.4)' } : undefined}
                >
                  ✓
                </button>
              </div>
              <div className="pt-1">
                <div className={`text-sm font-medium leading-tight transition-colors duration-300
                  ${isSubmitStep ? 'text-accent' : 'text-neutral-600'}`}>
                  Review
                </div>
                <div className="text-xs text-neutral-600 font-mono mt-0.5">Authorization</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT: form content ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile progress bar (hidden on lg+ where sidebar takes over) */}
          <div className="lg:hidden mb-8 fade-in-up" style={{ animationDelay: '0.05s' }}>
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

          {/* Company name */}
          <div className="mb-8 fade-in-up">
            <div className="flex items-center justify-between mb-1">
              <label className="serai-label !mb-0">Target Organization</label>
              <button
                type="button"
                onClick={quickFill}
                className="flex items-center gap-1.5 font-mono text-xs text-neutral-500
                           hover:text-accent transition-colors duration-200 group"
                title="Fill with a randomized example organization"
              >
                <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Quick fill
              </button>
            </div>
            <input
              className="serai-input text-base font-semibold"
              placeholder="Enter company / organization name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
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

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Target',           companyName || '-'],
                    ['Employees added',  people.employees.length],
                    ['Tech stack',       technology.public_tech_stack || '-'],
                    ['Exposed services', technology.exposed_services || '-'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-black/20 border border-border/50 rounded px-3 py-2">
                      <div className="text-xs text-neutral-600 font-mono mb-0.5">{label}</div>
                      <div className="text-sm text-neutral-300 font-medium truncate">{String(val)}</div>
                    </div>
                  ))}
                </div>

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
                onClick={() => {
                  if (!companyName.trim()) { toast.warning('Company name is required.'); return }
                  if (!authorized) { toast.warning('You must confirm authorization before submitting.'); return }
                  setShowAuthModal(true)
                }}
                disabled={loading}
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
      </div>
    </div>

    {showAuthModal && (
      <AuthorizationModal
        company={companyName}
        onConfirm={() => { setShowAuthModal(false); handleSubmit() }}
        onCancel={() => setShowAuthModal(false)}
      />
    )}
    </>
  )
}
