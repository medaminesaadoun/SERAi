import { useState, useEffect } from 'react'

const STEPS = [
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

const STEP_MS = [1100, 1800, 1400, 2800, 2400, 1900, 2400, 3200, 1900, 2400, 1900, 99999]

function SkeletonBlock({ className }) {
  return (
    <div className={`rounded animate-pulse bg-white/5 ${className}`} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto mt-8 opacity-40 pointer-events-none select-none">
      {/* Header */}
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

      {/* Score + Radar grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="serai-card p-6">
          <SkeletonBlock className="h-2.5 w-28 mb-5" />
          {/* Score ring ghost */}
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

      {/* Section skeletons */}
      {[[1], [3], [2], [3]].map((counts, si) => (
        <div key={si} className="mb-8">
          <div className="flex items-center gap-3 mb-4 pb-3"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <SkeletonBlock className="h-2.5 w-8" />
            <SkeletonBlock className="h-5 w-32" />
          </div>
          <div className="space-y-3">
            {counts.map((_, i) => (
              <SkeletonBlock key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalysisLoader({ company, speed = 1, onComplete }) {
  const [completedSteps, setCompleted] = useState([])
  const [currentStep, setCurrent]      = useState(0)

  useEffect(() => {
    let stepIndex = 0
    let timeout

    function advance() {
      if (stepIndex >= STEPS.length) return
      setCurrent(stepIndex)
      // Last step has 99999ms delay — in demo we cap it and fire onComplete instead
      const rawDelay = STEP_MS[stepIndex] ?? 2000
      const delay    = rawDelay === 99999
        ? (onComplete ? 400 : 99999)
        : Math.round(rawDelay * speed)

      timeout = setTimeout(() => {
        setCompleted(prev => [...prev, stepIndex])
        stepIndex++
        if (stepIndex >= STEPS.length && onComplete) {
          onComplete()
        } else {
          advance()
        }
      }, delay)
    }

    advance()
    return () => clearTimeout(timeout)
  }, [speed, onComplete])

  return (
    <div className="max-w-5xl mx-auto">
      {/* Terminal panel */}
      <div className="serai-card p-5 mb-2 fade-in-up">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="font-mono text-xs text-neutral-600 ml-2">
            serai — analyzing {company}
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-sm min-h-[200px]">
          {STEPS.map((msg, i) => {
            const done    = completedSteps.includes(i)
            const active  = currentStep === i && !done
            const pending = i > currentStep

            if (pending) return null

            return (
              <div key={i} className={`flex items-center gap-3 transition-opacity duration-300
                ${pending ? 'opacity-0' : 'opacity-100'}`}>
                {/* Icon */}
                <span className="shrink-0 w-4 text-center">
                  {done ? (
                    <span className="text-accent text-xs">✓</span>
                  ) : active ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                  ) : (
                    <span className="text-neutral-700">·</span>
                  )}
                </span>

                {/* Message */}
                <span className={
                  done    ? 'text-neutral-600' :
                  active  ? 'text-neutral-200' :
                            'text-neutral-700'
                }>
                  {msg}
                </span>

                {/* Active blinking cursor */}
                {active && (
                  <span className="inline-block w-1.5 h-4 bg-accent animate-pulse" />
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom status bar */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-600">
            {completedSteps.length}/{STEPS.length} steps complete
          </span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-accent">
              {Math.round((completedSteps.length / STEPS.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Ghost dashboard skeleton below */}
      <DashboardSkeleton />
    </div>
  )
}
