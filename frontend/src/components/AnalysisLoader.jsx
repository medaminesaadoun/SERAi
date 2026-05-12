import { useState, useEffect, useRef } from 'react'

// ── Demo mode: fake timed steps ───────────────────────────────────────────────
const DEMO_STEPS = [
  'Connecting to Ollama…',
  'Loading qwen3.5:4b model…',
  'Processing OSINT payload…',
  'Analyzing people exposure…',
  'Mapping technology footprint…',
  'Identifying process leaks…',
  'Assessing digital footprint…',
  'Generating attack scenarios…',
  'Mapping MITRE ATT&CK techniques…',
  'Computing dimension risk scores…',
  'Drafting recommendations…',
  'Finalizing analysis report…',
]
const DEMO_STEP_MS = [1100, 1800, 1400, 2800, 2400, 1900, 2400, 3200, 1900, 2400, 1900, 99999]

// ── Streaming mode: event-driven milestones ───────────────────────────────────
const STREAM_STEPS = [
  { label: 'Connecting to Ollama…',        phase: 'connecting' },
  { label: 'Sending OSINT payload…',        phase: 'connecting' },
  { label: 'Receiving AI analysis…',        phase: 'generating' },
  { label: 'Parsing response JSON…',        phase: 'finalizing' },
  { label: 'Saving results…',              phase: 'done' },
]

function phaseToStepState(phase) {
  switch (phase) {
    case 'connecting':  return { done: [],          current: 0 }
    case 'generating':  return { done: [0, 1],      current: 2 }
    case 'finalizing':  return { done: [0, 1, 2],   current: 3 }
    case 'done':        return { done: [0,1,2,3,4], current: -1 }
    default:            return { done: [],           current: 0 }
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function SkeletonBlock({ className, style }) {
  return <div className={`rounded animate-pulse bg-white/5 ${className}`} style={style} />
}

function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto mt-8 opacity-40 pointer-events-none select-none">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <SkeletonBlock className="h-2.5 w-24" />
          <SkeletonBlock className="h-6 w-44" />
          <SkeletonBlock className="h-2 w-28" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-10 w-28" />
          <SkeletonBlock className="h-10 w-32 bg-accent/10" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="serai-card p-6">
          <SkeletonBlock className="h-2.5 w-28 mb-5" />
          <div className="w-44 h-44 rounded-full mx-auto mb-4 flex items-center justify-center"
               style={{ border: '9px solid rgba(255,255,255,0.06)' }}>
            <SkeletonBlock className="h-10 w-16" />
          </div>
          <div className="flex justify-center mb-6">
            <SkeletonBlock className="h-7 w-24" />
          </div>
          {[82, 58, 44, 71].map((w, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between mb-1.5">
                <SkeletonBlock className="h-2.5 w-20" />
                <SkeletonBlock className="h-2.5 w-10" />
              </div>
              <div className="h-1.5 rounded-full bg-white/5">
                <SkeletonBlock className="h-full rounded-full" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="serai-card p-6 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full"
               style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
        </div>
      </div>
      {[[1], [3], [2], [3]].map((counts, si) => (
        <div key={si} className="mb-8">
          <div className="flex items-center gap-3 mb-4 pb-3"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <SkeletonBlock className="h-2.5 w-8" />
            <SkeletonBlock className="h-5 w-32" />
          </div>
          <div className="space-y-3">
            {counts.map((_, i) => <SkeletonBlock key={i} className="h-24 w-full" />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function StepList({ steps, completedSteps, currentStep }) {
  return (
    <div className="space-y-1.5 font-mono text-sm min-h-[160px]">
      {steps.map((msg, i) => {
        const done    = completedSteps.includes(i)
        const active  = currentStep === i && !done
        const pending = i > currentStep && !done
        if (pending) return null
        return (
          <div key={i} className="flex items-center gap-3 transition-opacity duration-300 opacity-100">
            <span className="shrink-0 w-4 text-center">
              {done ? (
                <span className="text-accent text-xs">✓</span>
              ) : active ? (
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
              ) : (
                <span className="text-neutral-700">·</span>
              )}
            </span>
            <span className={done ? 'text-neutral-600' : active ? 'text-neutral-200' : 'text-neutral-700'}>
              {msg}
            </span>
            {active && <span className="inline-block w-1.5 h-4 bg-accent animate-pulse" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalysisLoader({ company, speed = 1, onComplete, streamEvent }) {
  const isStreamMode = streamEvent !== undefined

  // ── Demo / timer mode state ──
  const [demoCompleted, setDemoCompleted] = useState([])
  const [demoCurrent,   setDemoCurrent]   = useState(0)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    if (isStreamMode) return // skip timer in streaming mode

    let stepIndex = 0
    let timeout

    function advance() {
      if (stepIndex >= DEMO_STEPS.length) return
      setDemoCurrent(stepIndex)
      const rawDelay = DEMO_STEP_MS[stepIndex] ?? 2000
      const delay    = rawDelay === 99999
        ? (onCompleteRef.current ? 400 : 99999)
        : Math.round(rawDelay * speed)

      timeout = setTimeout(() => {
        setDemoCompleted(prev => [...prev, stepIndex])
        stepIndex++
        if (stepIndex >= DEMO_STEPS.length && onCompleteRef.current) {
          onCompleteRef.current()
        } else {
          advance()
        }
      }, delay)
    }

    advance()
    return () => clearTimeout(timeout)
  }, [speed, isStreamMode])

  // ── Streaming mode state ──
  const [streamPhase,    setStreamPhase]   = useState('connecting')
  const [thinkBuffer,    setThinkBuffer]   = useState('')
  const [tokenBuffer,    setTokenBuffer]   = useState('')
  const tokenBoxRef = useRef(null)

  useEffect(() => {
    if (!streamEvent) return
    if (streamEvent.type === 'connected')  setStreamPhase('generating')
    if (streamEvent.type === 'thinking')   setThinkBuffer(prev => prev + streamEvent.content)
    if (streamEvent.type === 'token')      setTokenBuffer(prev => prev + streamEvent.content)
    if (streamEvent.type === 'done')       setStreamPhase('done')
    if (streamEvent.type === 'error')      setStreamPhase('connecting')
  }, [streamEvent])

  // Auto-scroll token box
  useEffect(() => {
    if (tokenBoxRef.current) {
      tokenBoxRef.current.scrollTop = tokenBoxRef.current.scrollHeight
    }
  }, [tokenBuffer])

  // ── Derive display values ──
  let steps, completedSteps, currentStep, progressDone, progressTotal

  if (isStreamMode) {
    steps        = STREAM_STEPS.map(s => s.label)
    const state  = phaseToStepState(streamPhase)
    completedSteps = state.done
    currentStep    = state.current
    progressDone   = completedSteps.length
    progressTotal  = steps.length
  } else {
    steps          = DEMO_STEPS
    completedSteps = demoCompleted
    currentStep    = demoCurrent
    progressDone   = demoCompleted.length
    progressTotal  = DEMO_STEPS.length
  }

  const pct = Math.round((progressDone / progressTotal) * 100)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Terminal panel */}
      <div className="serai-card p-5 mb-2 fade-in-up">
        {/* Title bar */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="font-mono text-xs text-neutral-600 ml-2">
            serai - analyzing {company}
          </span>
        </div>

        {/* Step list */}
        <StepList steps={steps} completedSteps={completedSteps} currentStep={currentStep} />

        {/* Live token output (streaming mode only) */}
        {isStreamMode && (
          <div className="mt-4 rounded border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-border/40">
              <span className="font-mono text-xs text-neutral-500">
                {tokenBuffer.length > 0 ? 'model output' : thinkBuffer.length > 0 ? 'thinking…' : 'model output'}
              </span>
              <span className="font-mono text-xs text-accent/60">
                {tokenBuffer.length > 0
                  ? `${tokenBuffer.length} chars`
                  : thinkBuffer.length > 0
                    ? `${thinkBuffer.length} thought chars`
                    : 'waiting…'}
              </span>
            </div>
            <div
              ref={tokenBoxRef}
              className="p-3 font-mono text-xs leading-relaxed overflow-y-auto bg-black/40"
              style={{ minHeight: '120px', maxHeight: '260px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              {tokenBuffer.length > 0
                ? <span className="text-neutral-300">
                    {tokenBuffer}
                    <span className="inline-block w-1.5 h-3 bg-accent animate-pulse ml-0.5 align-middle" />
                  </span>
                : thinkBuffer.length > 0
                  ? <span className="text-neutral-600 italic">
                      {thinkBuffer}
                      <span className="inline-block w-1.5 h-3 bg-neutral-600 animate-pulse ml-0.5 align-middle" />
                    </span>
                  : <span className="text-neutral-600">Waiting for first token…</span>
              }
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-600">
            {progressDone}/{progressTotal} steps complete
          </span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-xs text-accent">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Ghost dashboard skeleton */}
      <DashboardSkeleton />
    </div>
  )
}
