import { useState, useRef, useCallback } from 'react'

/**
 * SSE consumer for SERAi streaming endpoints. Tracks per-task progress
 * (the live checklist the user sees) and exposes a cancel() function
 * that aborts the fetch and surfaces cancellation state to the caller.
 *
 * The endpoint is expected to emit a mix of events:
 *   - {type: "connected", ...}
 *   - {type: "task", id, label, status, elapsed_ms, error}
 *   - {type: "token"|"thinking"|"result", content}
 *   - {type: "cache_hit", ...}
 *   - {type: "done", ...}            -> {type: "done"}  signals success
 *   - {type: "cancelled", ...}       -> {type: "cancelled"} signals user cancel
 *   - {type: "error", message}       -> throws
 *
 * @param {string} url      - endpoint URL
 * @param {object} body     - JSON body to send (POST)
 * @param {object} options
 * @param {string} options.method  - default 'POST'
 * @param {string} options.modelId - just for identification
 */
export function useTaskStream(url, body, options = {}) {
  const [tasks, setTasks]         = useState([])
  const [streaming, setStreaming] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)   // {type, ...payload} of final event
  const [partialText, setPartial] = useState('')
  const accumRef                  = useRef('')
  const abortRef                  = useRef(null)

  const start = useCallback(async () => {
    if (!url) return
    setTasks([])
    setStreaming(true)
    setCancelled(false)
    setDone(false)
    setError('')
    setResult(null)
    setPartial('')
    accumRef.current = ''

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const fetchOptions = {
        method: options.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }
      if (fetchOptions.method !== 'GET' && body !== undefined) {
        fetchOptions.body = JSON.stringify(body)
      }

      const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
      const response = await fetch(`${base}${url}`, fetchOptions)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status} ${text}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload) continue
          let event
          try {
            event = JSON.parse(payload)
          } catch {
            continue
          }
          handleEvent(event)
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setCancelled(true)
      } else {
        setError(e.message || 'Stream failed')
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [url, JSON.stringify(body), options.method])

  function handleEvent(event) {
    switch (event.type) {
      case 'task':
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === event.id)
          if (idx === -1) {
            return [...prev, {
              id: event.id,
              label: event.label,
              status: event.status,
              elapsedMs: event.elapsed_ms,
              error: event.error,
            }]
          }
          const next = prev.slice()
          next[idx] = {
            ...next[idx],
            status: event.status,
            elapsedMs: event.elapsed_ms,
            error: event.error,
          }
          return next
        })
        break
      case 'token':
        accumRef.current += event.content
        setPartial(accumRef.current)
        break
      case 'thinking':
      case 'cache_hit':
      case 'user_message_id':
      case 'assistant_message_id':
        // Pass through, no specific UI state
        break
      case 'done':
        setDone(true)
        setResult(event)
        break
      case 'cancelled':
        setCancelled(true)
        setResult({ type: 'cancelled', ...event })
        break
      case 'error':
        setError(event.message || 'Unknown error')
        break
      default:
        break
    }
  }

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }, [])

  const reset = useCallback(() => {
    setTasks([])
    setStreaming(false)
    setCancelled(false)
    setDone(false)
    setError('')
    setResult(null)
    setPartial('')
    accumRef.current = ''
  }, [])

  return {
    tasks,
    streaming,
    cancelled,
    done,
    error,
    result,
    partialText,
    start,
    cancel,
    reset,
  }
}
