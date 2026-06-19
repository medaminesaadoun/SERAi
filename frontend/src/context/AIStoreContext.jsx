import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react'

const AIStoreContext = createContext(null)

/**
 * Global AI activity store. Tracks all in-flight (and recently-finished) AI
 * operations across the app so a single widget can display + cancel them
 * from anywhere, regardless of which view or component initiated them.
 *
 * Operation shape:
 *   {
 *     id:        string  // unique op id
 *     kind:      'analysis' | 'playbook' | 'chat'
 *     label:     string  // short human label (e.g. "Querying LLM", "CFO BEC playbook")
 *     tasks:     []      // latest task list snapshot
 *     streaming: bool
 *     cancelled: bool
 *     partialText: string
 *     tokenCount: number
 *     progress:  number  // 0..1
 *     ts:        number  // when registered
 *     persistUntil: number | null  // epoch ms; keeps op visible briefly after completion
 *   }
 */
export function AIStoreProvider({ children }) {
  const [ops, setOps]         = useState({})
  const controllers           = useRef({})  // {opId: AbortController}
  const tickRef               = useRef(null)

  // Tick every 250ms to update elapsed-time-derived UI in subscribed components
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setOps(prev => {
        const now = Date.now()
        let changed = false
        const next = { ...prev }
        for (const id in next) {
          const op = next[id]
          if (op.persistUntil && now >= op.persistUntil) {
            delete next[id]
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 250)
    return () => clearInterval(tickRef.current)
  }, [])

  const register = useCallback((id, meta = {}) => {
    if (!id) return null
    setOps(prev => ({
      ...prev,
      [id]: {
        id,
        kind: meta.kind || 'analysis',
        label: meta.label || 'AI task',
        tasks: [],
        streaming: true,
        cancelled: false,
        partialText: '',
        tokenCount: 0,
        progress: 0,
        ts: Date.now(),
        persistUntil: null,
        ...meta,
      },
    }))
    return id
  }, [])

  const update = useCallback((id, patch) => {
    if (!id) return
    setOps(prev => {
      const cur = prev[id]
      if (!cur) return prev
      return { ...prev, [id]: { ...cur, ...patch } }
    })
  }, [])

  const unregister = useCallback((id, opts = {}) => {
    if (!id) return
    const persistMs = opts.persistMs ?? 1500
    setOps(prev => {
      const cur = prev[id]
      if (!cur) return prev
      if (persistMs > 0) {
        return {
          ...prev,
          [id]: { ...cur, streaming: false, persistUntil: Date.now() + persistMs },
        }
      }
      const { [id]: _drop, ...rest } = prev
      return rest
    })
    delete controllers.current[id]
  }, [])

  const attachController = useCallback((id, controller) => {
    if (!id || !controller) return
    controllers.current[id] = controller
  }, [])

  const cancel = useCallback((id) => {
    const c = controllers.current[id]
    if (c && typeof c.abort === 'function') {
      try { c.abort() } catch { /* ignore */ }
    }
  }, [])

  const cancelAll = useCallback(() => {
    Object.keys(controllers.current).forEach(id => cancel(id))
  }, [cancel])

  const getOp = useCallback((id) => ops[id] || null, [ops])

  const [openPlaybookRequest, setOpenPlaybookRequest] = useState(null)
  const requestOpenPlaybook = useCallback((scenarioTitle, mode) => {
    setOpenPlaybookRequest({ scenarioTitle, mode, ts: Date.now() })
  }, [])
  const clearOpenPlaybookRequest = useCallback(() => {
    setOpenPlaybookRequest(null)
  }, [])

  const value = useMemo(() => ({
    ops,
    register,
    update,
    unregister,
    attachController,
    cancel,
    cancelAll,
    getOp,
    openPlaybookRequest,
    requestOpenPlaybook,
    clearOpenPlaybookRequest,
  }), [ops, register, update, unregister, attachController, cancel, cancelAll, getOp, openPlaybookRequest, requestOpenPlaybook, clearOpenPlaybookRequest])

  return <AIStoreContext.Provider value={value}>{children}</AIStoreContext.Provider>
}

export function useAIStore() {
  const ctx = useContext(AIStoreContext)
  if (!ctx) {
    // Soft-fail so non-wrapped code (tests, isolated components) doesn't crash
    return {
      ops: {},
      register: () => null,
      update: () => {},
      unregister: () => {},
      attachController: () => {},
      cancel: () => {},
      cancelAll: () => {},
      getOp: () => null,
      openPlaybookRequest: null,
      requestOpenPlaybook: () => {},
      clearOpenPlaybookRequest: () => {},
    }
  }
  return ctx
}
