import { useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Post-cancel dialog: shows the user the partial text that streamed in
 * before they cancelled, and offers three actions:
 *  - Copy to clipboard
 *  - Keep as draft (persists to localStorage + backend)
 *  - Discard
 */
export default function PartialSaveDialog({
  open,
  companyName,
  progressPct,
  partialText,
  onCopy,
  onKeepDraft,
  onDiscard,
  onClose,
}) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(partialText || '')
      setCopied(true)
      if (onCopy) onCopy()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select + execCommand
      const ta = document.createElement('textarea')
      ta.value = partialText || ''
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleKeep() {
    setSaving(true)
    try {
      if (onKeepDraft) await onKeepDraft()
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in-up">
      <div className="relative w-full max-w-2xl bg-bg border border-border rounded-sm shadow-2xl overflow-hidden"
           style={{ backgroundColor: 'var(--bg-hex)' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 bg-black/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-sm border border-yellow-500/40 bg-yellow-500/10">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs uppercase tracking-widest text-yellow-400">Generation cancelled</div>
              <div className="font-mono text-[10px] text-neutral-500 truncate">
                {companyName} · {Math.round((progressPct || 0) * 100)}% complete
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 flex items-center justify-center border border-border rounded-sm text-neutral-400 hover:text-accent hover:border-accent transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-neutral-400">
            {partialText
              ? 'Generation was interrupted. You can keep the partial text as a draft, copy it to your clipboard, or discard it.'
              : 'No tokens were streamed before the cancel. Nothing to keep — you can safely discard.'}
          </p>

          {partialText && (
            <div className="border border-border/60 rounded-sm bg-black/30 max-h-64 overflow-y-auto p-4">
              <pre className="font-mono text-[11px] text-neutral-400 whitespace-pre-wrap break-words leading-relaxed">{partialText}</pre>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(progressPct || 0) * 100}%`,
                  backgroundColor: '#eab308',
                }}
              />
            </div>
            <span className="font-mono text-[10px] text-neutral-500 shrink-0">
              {Math.round((progressPct || 0) * 100)}%
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex flex-wrap items-center justify-end gap-2 bg-black/30">
          <button
            onClick={onDiscard}
            className="font-mono text-xs px-3 py-1.5 border border-border text-neutral-500
                       hover:text-red-400 hover:border-red-500/40 rounded-sm uppercase tracking-widest transition-colors"
          >
            Discard
          </button>
          {partialText && (
            <button
              onClick={handleCopy}
              className="font-mono text-xs px-3 py-1.5 border border-border text-neutral-300
                         hover:text-accent hover:border-accent/40 rounded-sm uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button
            onClick={handleKeep}
            disabled={saving || !partialText}
            className="font-mono text-xs px-4 py-1.5 bg-accent/15 border border-accent/40 text-accent
                       hover:bg-accent/25 rounded-sm uppercase tracking-widest transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="inline-block w-2.5 h-2.5 border border-accent border-t-transparent rounded-full animate-spin" />
                Saving
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Keep as draft
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
