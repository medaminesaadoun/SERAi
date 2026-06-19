import { useEffect, useRef } from 'react'

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function stripHtmlTags(s) {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:b|i|em|strong|u|span|font)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
}

function renderInline(text) {
  const parts = []
  let remaining = text
  let key = 0

  const patterns = [
    { re: /\*\*(.+?)\*\*/g, render: (m) => <strong key={key++} className="font-semibold text-neutral-100">{m[1]}</strong> },
    { re: /`([^`]+)`/g,     render: (m) => <code key={key++} className="font-mono text-[0.85em] px-1 py-0.5 bg-white/8 border border-white/10 rounded-sm text-accent">{m[1]}</code> },
    { re: /\b(T[0-9]{4}(?:\.[0-9]{3})?)\b/g, render: (m) => <span key={key++} className="font-mono text-[0.85em] text-cyan-400">{m[0]}</span> },
    { re: /\b(TA[0-9]{4})\b/g, render: (m) => <span key={key++} className="font-mono text-[0.85em] text-cyan-400">{m[0]}</span> },
    { re: /(^|[^*])\*([^*\n]+)\*/g, render: (m) => <span key={key++}>{m[1]}<em className="italic text-neutral-200">{m[2]}</em></span> },
  ]

  while (remaining.length > 0) {
    let earliest = null
    let earliestPattern = null
    let earliestMatch = null

    for (const p of patterns) {
      p.re.lastIndex = 0
      const m = p.re.exec(remaining)
      if (m && (earliest === null || m.index < earliest)) {
        earliest = m.index
        earliestPattern = p
        earliestMatch = m
      }
    }

    if (earliest === null) {
      parts.push(remaining)
      break
    }

    if (earliest > 0) parts.push(remaining.slice(0, earliest))
    parts.push(earliestPattern.render(earliestMatch))
    const matchedLen = earliestMatch[0].length
    remaining = remaining.slice(earliest + matchedLen)
  }

  return parts
}

function isTableSeparator(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false
  const inner = trimmed.slice(1, -1)
  const cells = inner.split('|').map(c => c.trim())
  return cells.every(c => /^:?-{3,}:?$/.test(c))
}

function parseTableRow(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null
  const inner = trimmed.slice(1, -1)
  return inner.split('|').map(c => c.trim())
}

function renderTable(rows) {
  if (rows.length < 2) return null
  const header = rows[0]
  const body = rows.slice(1)
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/60">
            {header.map((cell, i) => (
              <th key={i} className="text-left font-mono font-semibold text-accent py-1.5 px-2 align-top">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-border/30 last:border-b-0">
              {row.map((cell, ci) => (
                <td key={ci} className="py-1.5 px-2 align-top text-neutral-300">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function isListBlock(lines) {
  return lines.every(l => /^\s*(?:[-*+]|\d+\.)\s+/.test(l))
}

function renderList(lines, ordered) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={ordered ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2'}>
      {lines.map((line, i) => {
        const text = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')
        return <li key={i} className="text-neutral-300">{renderInline(text)}</li>
      })}
    </Tag>
  )
}

function renderMarkdown(text) {
  if (!text) return null
  const cleaned = stripHtmlTags(text)
  const lines = cleaned.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.trim().startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length) i++
      blocks.push(
        <pre key={blocks.length} className="my-2 p-3 bg-black/40 border border-border/60 rounded-sm overflow-x-auto">
          <code className="font-mono text-xs text-neutral-200 whitespace-pre">
            {escapeHtml(codeLines.join('\n'))}
          </code>
        </pre>
      )
      continue
    }

    if (parseTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const tableRows = [parseTableRow(line)]
      i += 2
      while (i < lines.length && parseTableRow(lines[i])) {
        tableRows.push(parseTableRow(lines[i]))
        i++
      }
      blocks.push(<div key={blocks.length}>{renderTable(tableRows)}</div>)
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(<h4 key={blocks.length} className="font-mono text-sm font-semibold text-accent mt-3 mb-1.5">{renderInline(line.slice(4))}</h4>)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(<h3 key={blocks.length} className="font-mono text-sm font-semibold text-accent mt-3 mb-1.5">{renderInline(line.slice(3))}</h3>)
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push(<h2 key={blocks.length} className="font-display text-base font-semibold text-neutral-100 mt-3 mb-1.5">{renderInline(line.slice(2))}</h2>)
      i++
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const listLines = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        listLines.push(lines[i])
        i++
      }
      blocks.push(<div key={blocks.length}>{renderList(listLines, false)}</div>)
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const listLines = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listLines.push(lines[i])
        i++
      }
      blocks.push(<div key={blocks.length}>{renderList(listLines, true)}</div>)
      continue
    }

    const paraLines = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3} |```|[-*+]\s|\d+\.\s|\|)/.test(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push(
      <p key={blocks.length} className="my-2 leading-relaxed">
        {renderInline(paraLines.join(' '))}
      </p>
    )
  }

  return <>{blocks}</>
}

export default function ChatMessage({ message, isUser }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && message._streaming) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [message.content, message._streaming])

  if (isUser) {
    return (
      <div className="flex justify-end fade-in-up" ref={ref}>
        <div className="max-w-[85%] px-4 py-2.5 bg-accent/15 border border-accent/30 rounded-sm text-sm text-neutral-100">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start fade-in-up" ref={ref}>
      <div className="max-w-[90%] px-4 py-2.5 bg-white/4 border border-border/60 rounded-sm text-sm text-neutral-300 leading-relaxed">
        <div className="break-words">
          {renderMarkdown(message.content || '')}
          {message._streaming && message.content === '' && (
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
          {message._streaming && message.content !== '' && (
            <span className="inline-block w-1.5 h-3.5 bg-accent/70 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  )
}
