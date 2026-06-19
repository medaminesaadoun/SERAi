import { useState, useRef, useCallback, useEffect } from 'react'
import { getSuggestions } from '../data/suggestedQuestions'
import { useAIStore } from '../context/AIStoreContext'

const API = '/api'

const genOpId = () => `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function useChat({ analysis, mode }) {
  const [messages, setMessages]     = useState([])
  const [streaming, setStreaming]   = useState(false)
  const [cancelled, setCancelled]   = useState(false)
  const [partialText, setPartial]   = useState('')
  const [tasks, setTasks]           = useState([])
  const [error, setError]           = useState('')
  const accumRef                    = useRef('')
  const abortRef                    = useRef(null)
  const opIdRef                     = useRef(null)
  const mountedRef                  = useRef(true)
  const store                       = useAIStore()

  useEffect(() => () => { mountedRef.current = false }, [])

  const analysisId = analysis?.id

  // Initial load of existing history
  const loadHistory = useCallback(async () => {
    if (!analysisId) return
    try {
      const r = await fetch(`${API}/analyses/${analysisId}/chat`)
      if (r.ok) {
        const data = await r.json()
        setMessages(data.messages || [])
      }
    } catch (e) {
      // silent - empty state
    }
  }, [analysisId])

  // Cleanup on unmount: unregister any in-flight op
  useEffect(() => {
    return () => {
      if (opIdRef.current) {
        store.unregister(opIdRef.current, { persistMs: 0 })
        opIdRef.current = null
      }
    }
  }, [store])

  const publishTasks = useCallback((newTasks) => {
    if (!opIdRef.current) return
    store.update(opIdRef.current, { tasks: newTasks })
  }, [store])

  const send = useCallback(async (text) => {
    if (!analysisId || !text.trim() || streaming) return

    setError('')
    setCancelled(false)
    setPartial('')
    setTasks([])
    const userMsg = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }
    const assistantMsg = {
      id: `tmp-asst-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      _streaming: true,
    }

    setMessages(m => [...m, userMsg, assistantMsg])
    accumRef.current = ''

    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)

    // Register with global AI activity store
    const opId = genOpId()
    opIdRef.current = opId
    const labelSnippet = text.trim().length > 60
      ? text.trim().slice(0, 57) + '...'
      : text.trim()
    store.register(opId, {
      kind: 'chat',
      label: `Chat · "${labelSnippet}"`,
      progress: 0,
      streaming: true,
    })
    store.attachController(opId, controller)

    try {
      const response = await fetch(`${API}/analyses/${analysisId}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          mode: mode || 'attack',
          context: analysis ? {
            company_name: analysis.company_name,
            form_data: analysis.form_data || {},
            result: analysis.result,
          } : null,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            handleEvent(event, userMsg, assistantMsg)
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    } catch (e) {
      if (!mountedRef.current) return
      if (e.name === 'AbortError') {
        setCancelled(true)
        setPartial(accumRef.current)
        setMessages(m => m.map(msg =>
          msg.id === assistantMsg.id
            ? { ...msg, content: accumRef.current, _streaming: false, _cancelled: true }
            : msg
        ))
        store.unregister(opId, { persistMs: 1500 })
      } else {
        setError(e.message || 'Stream failed')
        setMessages(m => m.filter(msg => msg.id !== assistantMsg.id))
        store.unregister(opId, { persistMs: 0 })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      opIdRef.current = null
    }
  }, [analysisId, mode, streaming, store])

  const handleEvent = (event, userMsg, assistantMsg) => {
    switch (event.type) {
      case 'connected':
        break
      case 'task':
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === event.id)
          const next = prev.slice()
          const entry = {
            id: event.id,
            label: event.label,
            status: event.status,
            elapsedMs: event.elapsed_ms,
            error: event.error,
          }
          if (idx === -1) next.push(entry)
          else next[idx] = { ...next[idx], ...entry }
          publishTasks(next)
          return next
        })
        break
      case 'user_message_id':
        setMessages(m => m.map(msg =>
          msg.id === userMsg.id ? { ...msg, id: event.id } : msg
        ))
        break
      case 'assistant_message_id':
        setMessages(m => m.map(msg =>
          msg.id === assistantMsg.id ? { ...msg, id: event.id } : msg
        ))
        break
      case 'token':
        accumRef.current += event.content
        setMessages(m => m.map(msg =>
          msg.id === assistantMsg.id
            ? { ...msg, content: accumRef.current }
            : msg
        ))
        // Mirror to global store: token count + partial text
        if (opIdRef.current) {
          const tokenCount = (accumRef.current.match(/\S+/g) || []).length
          store.update(opIdRef.current, {
            tokenCount,
            partialText: accumRef.current,
            streaming: true,
          })
        }
        break
      case 'done':
        setMessages(m => m.map(msg =>
          msg.id === assistantMsg.id
            ? { ...msg, content: accumRef.current, _streaming: false }
            : msg
        ))
        if (opIdRef.current) {
          store.unregister(opIdRef.current, { persistMs: 1500 })
          opIdRef.current = null
        }
        break
      case 'cancelled':
        if (!mountedRef.current) return
        setCancelled(true)
        setPartial(event.partial_text || accumRef.current)
        if (opIdRef.current) {
          store.unregister(opIdRef.current, { persistMs: 1500 })
          opIdRef.current = null
        }
        break
      case 'error':
        setError(event.message || 'Unknown error')
        setMessages(m => m.filter(msg => msg.id !== assistantMsg.id))
        if (opIdRef.current) {
          store.unregister(opIdRef.current, { persistMs: 0 })
          opIdRef.current = null
        }
        break
      default:
        break
    }
  }

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }, [])

  const clear = useCallback(async () => {
    if (!analysisId) return
    try {
      await fetch(`${API}/analyses/${analysisId}/chat`, { method: 'DELETE' })
      setMessages([])
    } catch (e) {
      setError('Failed to clear history')
    }
  }, [analysisId])

  return {
    messages,
    streaming,
    cancelled,
    partialText,
    tasks,
    error,
    send,
    stop,
    clear,
    loadHistory,
    suggestions: getSuggestions(mode),
  }
}
