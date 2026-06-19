import { useEffect } from 'react'
import { useAIStore } from '../context/AIStoreContext'
import { getAllStreams, subscribe } from '../hooks/usePlaybookStream'

export default function StreamAIBridge() {
  const store = useAIStore()

  useEffect(() => {
    const seenOps = new Set()

    function sync() {
      const streams = getAllStreams()

      for (const entry of streams) {
        const opId = `playbook-${entry.scenarioId}-${entry.mode}`

        if (entry.streaming) {
          if (!seenOps.has(opId)) {
            store.register(opId, {
              kind: 'playbook',
              label: `Playbook · ${entry.scenarioTitle}`,
              streaming: true,
            })
            seenOps.add(opId)
          }
          store.update(opId, {
            streaming: true,
            tasks: entry.tasks || [],
            tokenCount: (entry.text || '').match(/\S+/g)?.length || 0,
            partialText: entry.text || '',
          })
          if (entry.controller) {
            store.attachController(opId, entry.controller)
          }
        } else if (entry.done && !entry.error) {
          if (seenOps.has(opId)) {
            store.unregister(opId, { persistMs: 1500 })
            seenOps.delete(opId)
          }
        } else if (entry.error || entry.aborted) {
          if (seenOps.has(opId)) {
            store.unregister(opId, { persistMs: 0 })
            seenOps.delete(opId)
          }
        }
      }
    }

    sync()
    const unsubs = getAllStreams().map((e) => subscribe(e.key, sync))
    const interval = setInterval(sync, 500)

    return () => {
      unsubs.forEach((u) => u())
      clearInterval(interval)
      for (const opId of seenOps) {
        store.unregister(opId, { persistMs: 0 })
      }
      seenOps.clear()
    }
  }, [store])

  return null
}
