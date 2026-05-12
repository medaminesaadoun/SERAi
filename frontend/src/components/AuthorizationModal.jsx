import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const DELAY_MS = 8000

export default function AuthorizationModal({ company, onConfirm, onCancel }) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      const ms = Date.now() - startRef.current
      setElapsed(Math.min(ms, DELAY_MS))
      if (ms >= DELAY_MS) clearInterval(id)
    }, 50)
    return () => clearInterval(id)
  }, [])

  const ready = elapsed >= DELAY_MS
  const pct = (elapsed / DELAY_MS) * 100
  const remaining = Math.ceil((DELAY_MS - elapsed) / 1000)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div className="relative max-w-lg w-full bg-neutral-950 border border-neutral-800 rounded shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="border-b border-neutral-800 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <div className="font-mono text-xs text-red-400 uppercase tracking-widest">Legal Authorization Required</div>
            <h2 className="text-base font-bold text-white leading-tight">Confirm before proceeding</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-neutral-300 leading-relaxed">
            You are requesting a social engineering risk assessment of{' '}
            <strong className="text-white">{company || 'the target organization'}</strong>.
            This is a sensitive security operation.
          </p>

          <div className="bg-red-950/20 border border-red-900/40 rounded p-4 space-y-3 text-sm text-neutral-300 leading-relaxed">
            <p className="text-neutral-400 font-mono text-xs uppercase tracking-widest">By clicking confirm, you attest that:</p>
            <ul className="space-y-2.5">
              {[
                'You hold explicit written authorization from this organization\'s executive management to conduct this security assessment.',
                'This analysis is for legitimate defensive or contracted red team purposes only.',
                'You understand that unauthorized security assessments may constitute a criminal offense and expose you to civil liability.',
                'You will treat the generated report as confidential and handle it in accordance with applicable data protection obligations.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="text-red-500 shrink-0 font-bold mt-0.5">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Countdown */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-neutral-500">
                {ready ? 'You may now confirm' : `Please read carefully - ${remaining}s`}
              </span>
              {ready && (
                <span className="font-mono text-xs text-accent">Ready to confirm</span>
              )}
            </div>
            <div className="h-0.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: ready ? 'rgb(var(--color-accent))' : '#ef4444',
                  transition: 'width 50ms linear, background-color 400ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-6 py-4 flex justify-between items-center gap-3">
          <button onClick={onCancel} className="serai-btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={ready ? onConfirm : undefined}
            disabled={!ready}
            className={`serai-btn-primary text-sm flex items-center gap-2
              ${!ready ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {!ready
              ? `Confirm available in ${remaining}s`
              : '▶ I Authorize - Run Analysis'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
