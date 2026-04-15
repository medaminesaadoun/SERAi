import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'serai-onboarded'

/* Small pulsing "?" trigger + popover */
export function ConsentTooltip() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-4 h-4 rounded-full border border-accent/40 text-accent/60
                   hover:border-accent hover:text-accent transition-colors
                   flex items-center justify-center font-mono text-xs font-bold
                   shrink-0 mt-0.5"
        title="What does this mean?"
      >
        ?
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 z-50 fade-in-up"
             style={{ animationDuration: '0.2s' }}>
          <div className="serai-card p-4 shadow-2xl border-accent/25">
            {/* Caret */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3
                            rotate-45 bg-card border-r border-b border-border/60" />

            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                   className="w-4 h-4 text-yellow-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="font-semibold text-sm text-neutral-200">Authorization required</span>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed mb-3">
              Before conducting any security assessment, you must have <strong className="text-neutral-300">explicit
              written permission</strong> from an authorized representative of the target organization
              (e.g. CISO, CEO, or legal counsel).
            </p>

            <div className="space-y-1.5">
              {[
                'Written authorization document or signed scope',
                'Defined assessment scope and timeframe',
                'Point of contact at the organization',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-neutral-500">
                  <span className="text-accent mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-neutral-600">
              Unauthorized testing may violate the Computer Fraud and Abuse Act (CFAA)
              or equivalent laws in your jurisdiction.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* First-visit welcome banner — shown once on the landing page */
export function WelcomeBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fade-in-up mb-6">
      <div className="serai-card p-4 flex items-start gap-4 border-accent/25"
           style={{ borderLeftWidth: 3, borderLeftColor: 'rgb(var(--color-accent))' }}>
        <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/30
                        flex items-center justify-center text-accent text-sm font-bold font-mono">
          👋
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-neutral-200 mb-0.5">Welcome to SERAi</div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            This tool is for <strong className="text-neutral-300">authorized security assessments only</strong>.
            Before running an analysis, make sure you have written permission from the target organization.
            All processing is local — nothing leaves your machine.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-neutral-600 hover:text-neutral-300 transition-colors"
          title="Dismiss"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
