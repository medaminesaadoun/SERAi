import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, streaming, onStop }) {
  const [text, setText]       = useState('')
  const textareaRef           = useRef(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [text])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const v = text.trim()
    if (!v || streaming) return
    onSend(v)
    setText('')
  }

  return (
    <div className="border-t border-border bg-black/30 p-3">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ask a follow-up question..."
          disabled={streaming}
          className="flex-1 bg-bg border border-border rounded-sm px-3 py-2 text-sm text-neutral-200
                     placeholder:text-neutral-600 resize-none overflow-y-auto
                     focus:outline-none focus:border-accent/50 focus:bg-white/3
                     disabled:opacity-50 transition-colors"
          style={{ maxHeight: '140px' }}
        />
        {streaming ? (
          <button
            onClick={onStop}
            className="font-mono text-xs px-3 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10
                       rounded-sm uppercase tracking-widest transition-colors shrink-0"
            style={{ height: '36px' }}
          >
            Stop
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="font-mono text-xs px-4 py-2 bg-accent text-bg font-semibold uppercase tracking-widest
                       rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30
                       disabled:cursor-not-allowed shrink-0"
            style={{ height: '36px' }}
          >
            Send
          </button>
        )}
      </div>
      <div className="mt-1.5 text-[10px] font-mono text-neutral-700 tracking-wider">
        Enter to send · Shift+Enter for newline
      </div>
    </div>
  )
}
