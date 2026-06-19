import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { useChat } from '../hooks/useChat'

const API = '/api'

export default function ChatPanel({ analysis, mode, open, onClose, initialMessage = null }) {
  const { messages, streaming, cancelled, partialText, tasks, error, send, stop, clear, loadHistory, suggestions } = useChat({ analysis, mode })
  const scrollRef = useRef(null)
  const sentInitial = useRef(false)

  useEffect(() => {
    if (open && analysis) loadHistory()
  }, [open, analysis, loadHistory])

  useEffect(() => {
    if (open && initialMessage && !sentInitial.current && analysis) {
      sentInitial.current = true
      send(initialMessage)
    }
    if (!open) sentInitial.current = false
  }, [open, initialMessage, analysis, send])

  useEffect(() => {
    if (scrollRef.current && (streaming || messages.length > 0)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streaming])

  if (!open || !analysis) return null

  const isAtk = mode === 'attack'

  function handleClear() {
    if (window.confirm('Clear all chat history for this analysis?')) {
      clear()
    }
  }

  return createPortal(
    <div
      className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-40 flex flex-col border-l border-border
                 bg-bg/95 backdrop-blur-md shadow-2xl slide-from-right"
      style={{ animationDuration: '0.25s' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-black/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-sm bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-widest text-neutral-300">Ask AI</div>
            <div className="font-mono text-[10px] text-neutral-600 truncate">
              {analysis.company_name} · {isAtk ? 'ATK' : 'DEF'} mode
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="font-mono text-[10px] px-2 py-1 border border-border text-neutral-500
                         hover:text-red-400 hover:border-red-500/40 rounded-sm uppercase tracking-widest
                         transition-colors"
              title="Clear chat history"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-border rounded-sm
                       text-neutral-400 hover:text-accent hover:border-accent transition-colors"
            aria-label="Close chat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-12 h-12 mb-4 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h3 className="font-mono text-sm uppercase tracking-widest text-neutral-300 mb-2">
              Ask anything about this analysis
            </h3>
            <p className="text-xs text-neutral-600 mb-6 max-w-xs">
              The AI has full context of your assessment and can drill into specific scenarios or mitigations.
            </p>
            <div className="space-y-2 w-full max-w-xs">
              <div className="font-mono text-[10px] text-neutral-700 uppercase tracking-widest mb-2 text-left">
                Suggested questions
              </div>
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="w-full text-left text-xs px-3 py-2.5 bg-white/3 border border-border/60
                             rounded-sm text-neutral-400 hover:text-accent hover:border-accent/40
                             hover:bg-accent/5 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <ChatMessage key={m.id} message={m} isUser={m.role === 'user'} />
        ))}

        {error && (
          <div className="text-xs text-red-400 font-mono border border-red-500/30 bg-red-500/8 px-3 py-2 rounded-sm">
            ⚠ {error}
          </div>
        )}

        {cancelled && partialText && !streaming && (
          <div className="border-t border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-300 font-mono flex items-center gap-2">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="flex-1">Response cancelled · {partialText.length} chars kept</span>
            <button
              onClick={() => navigator.clipboard?.writeText(partialText).catch(() => {})}
              className="text-[10px] uppercase tracking-widest text-yellow-300/80 hover:text-yellow-200"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      <ChatInput onSend={send} streaming={streaming} onStop={stop} />
    </div>,
    document.body
  )
}
