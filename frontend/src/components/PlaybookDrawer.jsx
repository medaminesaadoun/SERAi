import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const SECTION_HEADINGS = [
  'Reconnaissance',
  'Initial Contact',
  'Execution',
  'Impact',
  'Detection Indicators',
  'Mitigations',
]

function parsePlaybook(text) {
  const parts = []
  let remaining = text

  while (remaining.length > 0) {
    const match = remaining.match(/^(.*?)(## (?:Reconnaissance|Initial Contact|Execution|Impact|Detection Indicators|Mitigations))([\s\S]*)/s)
    if (!match) {
      parts.push({ type: 'text', content: remaining })
      break
    }
    if (match[1].trim()) parts.push({ type: 'text', content: match[1] })
    const heading = match[2].replace('## ', '')
    const rest = match[3]
    const nextHeading = rest.match(/## (?:Reconnaissance|Initial Contact|Execution|Impact|Detection Indicators|Mitigations)/)
    if (nextHeading) {
      const bodyEnd = rest.indexOf(nextHeading[0])
      parts.push({ type: 'section', heading, content: rest.slice(0, bodyEnd) })
      remaining = rest.slice(bodyEnd)
    } else {
      parts.push({ type: 'section', heading, content: rest })
      break
    }
  }
  return parts
}

function PlaybookContent({ text, streaming }) {
  const parts = parsePlaybook(text)

  return (
    <div className="text-sm text-neutral-300 leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === 'section') {
          return (
            <div key={i}>
              <div className="font-mono text-xs text-accent uppercase tracking-widest border-b border-border/30 pb-1 mb-3 mt-6 first:mt-0">
                {part.content === '' && streaming
                  ? <span className="animate-pulse">{part.heading}</span>
                  : part.heading
                }
              </div>
              <div className="whitespace-pre-wrap text-neutral-400">{part.content}</div>
            </div>
          )
        }
        return part.content.trim()
          ? <div key={i} className="text-neutral-600 text-xs mb-2">{part.content}</div>
          : null
      })}
      {streaming && <span className="inline-block w-2 h-3.5 bg-accent/70 animate-pulse ml-0.5 align-middle" />}
    </div>
  )
}

export default function PlaybookDrawer({ scenario, companyName, mode, context, onClose, cachedText = '', onCache = () => {} }) {
  const [text, setText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const accumRef = useRef('')
  const isAtk = mode === 'attack'

  useEffect(() => {
    if (cachedText) {
      setText(cachedText)
      setDone(true)
    } else {
      startStream()
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [text])

  async function startStream() {
    setText('')
    setDone(false)
    setError('')
    setStreaming(true)
    accumRef.current = ''

    try {
      const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
      const response = await fetch(`${base}/api/scenarios/playbook/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, company_name: companyName, mode, context }),
      })

      if (!response.ok) throw new Error(`Server error ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'token') {
              accumRef.current += event.content
              setText(t => t + event.content)
            }
            if (event.type === 'done') {
              onCache(scenario.title, accumRef.current)
              setDone(true)
              setStreaming(false)
            }
            if (event.type === 'error') throw new Error(event.message)
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to generate playbook.')
      setStreaming(false)
    }
  }

  const LIKELIHOOD_COLOR = { HIGH: '#ef4444', MEDIUM: '#eab308', LOW: '#22c55e' }
  const liColor = LIKELIHOOD_COLOR[scenario.likelihood] || '#6b7280'
  const impColor = LIKELIHOOD_COLOR[scenario.impact] || '#6b7280'
  const modeColor = isAtk ? 'text-red-400 border-red-500/30 bg-red-500/5' : 'text-blue-400 border-blue-500/30 bg-blue-500/5'

  return createPortal(
    <div className="fixed inset-0 z-[500] flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-[500px] max-w-[92vw] h-full bg-bg border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">
              // Attack Playbook
            </div>
            <div className="font-bold text-base text-neutral-100 leading-snug">{scenario.title}</div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${modeColor}`}>
                {isAtk ? 'ATK' : 'DEF'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-sm"
                    style={{ color: 'rgb(var(--color-accent))', background: 'rgb(var(--color-accent) / 0.08)', border: '1px solid rgb(var(--color-accent) / 0.2)' }}>
                {scenario.mitre_technique}
              </span>
              <span className="font-mono text-xs" style={{ color: liColor }}>L:{scenario.likelihood}</span>
              <span className="font-mono text-xs" style={{ color: impColor }}>I:{scenario.impact}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {done && (
              <button
                onClick={() => { onCache(scenario.title, ''); startStream() }}
                className="font-mono text-xs text-neutral-500 hover:text-accent transition-colors flex items-center gap-1"
                title="Regenerate"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors rounded hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Streaming status bar */}
        {streaming && (
          <div className="px-5 py-2 border-b border-border/50 flex items-center gap-2 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs text-neutral-500">Generating playbook...</span>
          </div>
        )}

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 pb-20">
          {error ? (
            <div className="text-red-400 font-mono text-sm">{error}</div>
          ) : text ? (
            <PlaybookContent text={text} streaming={streaming} />
          ) : (
            <div className="flex items-center gap-3 text-neutral-600 font-mono text-xs py-8">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Connecting...
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
