// Module-level stream registry
// Key: `${scenarioId}__${mode}`
// Value: StreamEntry with controller, text, tasks, done, error, subscribers, etc.

const liveStreams = new Map()

function makeKey(scenarioId, mode) {
  return `${scenarioId}__${mode}`
}

function notify(entry) {
  entry.subscribers.forEach((sub) => {
    try { sub.onUpdate(snapshotEntry(entry)) } catch (e) { /* ignore */ }
  })
}

function snapshotEntry(entry) {
  return {
    key: entry.key,
    text: entry.text,
    tasks: entry.tasks,
    done: entry.done,
    error: entry.error,
    streaming: entry.streaming,
    aborted: entry.aborted,
    scenarioId: entry.scenarioId,
    scenarioTitle: entry.scenarioTitle,
    mode: entry.mode,
    startedAt: entry.startedAt,
    completedAt: entry.completedAt,
  }
}

function startStreamForEntry(entry, scenario, companyName, mode, context) {
  entry.controller = new AbortController()
  entry.streaming = true
  entry.text = ''
  entry.tasks = []
  entry.done = false
  entry.error = ''
  entry.aborted = false
  entry.startedAt = Date.now()
  entry.completedAt = null

  notify(entry)

  const base = import.meta.env.DEV ? 'http://localhost:8000' : ''

  fetch(`${base}/api/scenarios/playbook/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, company_name: companyName, mode, context }),
    signal: entry.controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Server error ${response.status}`)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function pump() {
        return reader.read().then(({ done: streamDone, value }) => {
          if (streamDone) return
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              if (event.type === 'task') {
                const idx = entry.tasks.findIndex((t) => t.id === event.id)
                const next = entry.tasks.slice()
                const taskEntry = {
                  id: event.id,
                  label: event.label,
                  status: event.status,
                  elapsedMs: event.elapsed_ms,
                  error: event.error,
                }
                if (idx === -1) next.push(taskEntry)
                else next[idx] = { ...next[idx], ...taskEntry }
                entry.tasks = next
              } else if (event.type === 'token') {
                entry.text += event.content
              } else if (event.type === 'done') {
                entry.done = true
                entry.streaming = false
                entry.completedAt = Date.now()
                scheduleEviction(entry.key)
              } else if (event.type === 'cancelled') {
                entry.error = 'Generation cancelled'
                entry.streaming = false
                entry.aborted = true
                entry.completedAt = Date.now()
                scheduleEviction(entry.key, 0)
              } else if (event.type === 'error') {
                throw new Error(event.message)
              }
              notify(entry)
            } catch (e) {
              if (e && e.message && !entry.aborted) {
                entry.error = e.message
                entry.streaming = false
                entry.completedAt = Date.now()
                notify(entry)
                scheduleEviction(entry.key, 0)
              }
            }
          }
          return pump()
        })
      }

      return pump()
    })
    .catch((e) => {
      if (e.name === 'AbortError') {
        if (!entry.aborted) {
          entry.error = 'Generation cancelled'
          entry.aborted = true
        }
      } else if (!entry.error) {
        entry.error = e.message || 'Failed to generate playbook.'
      }
      entry.streaming = false
      entry.completedAt = Date.now()
      notify(entry)
      scheduleEviction(entry.key, entry.aborted ? 0 : 30000)
    })
}

const evictionTimers = new Map()

function scheduleEviction(key, ms = 5 * 60 * 1000) {
  if (evictionTimers.has(key)) clearTimeout(evictionTimers.get(key))
  const timer = setTimeout(() => {
    const entry = liveStreams.get(key)
    if (entry && entry.subscribers.size === 0) {
      liveStreams.delete(key)
    }
    evictionTimers.delete(key)
  }, ms)
  evictionTimers.set(key, timer)
}

export function getOrCreateStream(scenarioId, mode, scenario, companyName, context, scenarioTitle) {
  const key = makeKey(scenarioId, mode)
  let entry = liveStreams.get(key)
  if (!entry) {
    entry = {
      key,
      scenarioId,
      scenarioTitle,
      mode,
      controller: null,
      text: '',
      tasks: [],
      done: false,
      error: '',
      streaming: false,
      aborted: false,
      subscribers: new Set(),
      startedAt: null,
      completedAt: null,
      scenario,
      companyName,
      context,
    }
    liveStreams.set(key, entry)
  }
  return entry
}

export function startStream(scenarioId, mode, scenario, companyName, context, scenarioTitle) {
  const entry = getOrCreateStream(scenarioId, mode, scenario, companyName, context, scenarioTitle)
  if (!entry.streaming && !entry.done) {
    startStreamForEntry(entry, scenario, companyName, mode, context, scenarioTitle)
  }
  return entry
}

export function subscribe(key, onUpdate) {
  const entry = liveStreams.get(key)
  if (!entry) return () => {}
  const subscriber = { onUpdate }
  entry.subscribers.add(subscriber)
  // Push current state immediately
  try { onUpdate(snapshotEntry(entry)) } catch (e) { /* ignore */ }
  return () => {
    entry.subscribers.delete(subscriber)
  }
}

export function cancelStream(key) {
  const entry = liveStreams.get(key)
  if (entry && entry.controller) {
    entry.controller.abort()
  }
}

export function getAllActiveStreams() {
  return Array.from(liveStreams.values()).filter((e) => e.streaming)
}

export function getAllStreams() {
  return Array.from(liveStreams.values())
}

import { useState, useEffect } from 'react'

export function usePlaybookStream({ scenarioId, mode }) {
  const key = `${scenarioId}__${mode}`
  const [state, setState] = useState(() => {
    const entry = liveStreams.get(key)
    return entry ? snapshotEntry(entry) : null
  })

  useEffect(() => {
    const unsub = subscribe(key, setState)
    return unsub
  }, [key])

  const cancel = () => cancelStream(key)
  const text = state?.text || ''
  const done = state?.done || false
  const error = state?.error || ''
  const tasks = state?.tasks || []
  const streaming = state?.streaming || false

  return { state, text, done, error, tasks, streaming, cancel, key }
}
