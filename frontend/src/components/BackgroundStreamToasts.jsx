import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAllStreams, cancelStream, subscribe } from '../hooks/usePlaybookStream'
import { useAIStore } from '../context/AIStoreContext'

export default function BackgroundStreamToasts() {
  const store = useAIStore()
  const [streams, setStreams] = useState([])

  useEffect(() => {
    function refresh() {
      setStreams(getAllStreams().filter((e) => e.streaming))
    }
    refresh()
    // Subscribe to all current streams
    const unsubs = getAllStreams().map((entry) =>
      subscribe(entry.key, refresh)
    )
    // Poll every 2s to catch new streams
    const interval = setInterval(refresh, 2000)
    return () => {
      unsubs.forEach((u) => u())
      clearInterval(interval)
    }
  }, [streams.length])

  if (streams.length === 0) return null

  return createPortal(
    <div
      className="fixed left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2 z-[200] pointer-events-none"
      style={{ bottom: '24px', maxWidth: '480px', width: 'calc(100% - 48px)' }}
    >
      {streams.slice(0, 3).map((entry) => (
        <div
          key={entry.key}
          className="pointer-events-auto bg-bg/95 backdrop-blur-md border border-accent/30 rounded-sm
                     shadow-2xl px-4 py-3 fade-in-up flex items-center gap-3"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
              {entry.mode === 'attack' ? 'ATK' : 'DEF'} Playbook
            </div>
            <div className="text-xs text-neutral-300 truncate">
              {entry.scenarioTitle}
            </div>
            <div className="text-[10px] font-mono text-neutral-600">
              {(entry.tasks || []).filter((t) => t.status === 'completed').length} /{' '}
              {(entry.tasks || []).length || '?'} tasks · generation continues
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => store.requestOpenPlaybook(entry.scenarioId, entry.mode)}
              className="font-mono text-[10px] px-2 py-1 border border-accent/40 text-accent
                         hover:bg-accent/10 rounded-sm uppercase tracking-widest transition-colors"
            >
              Open
            </button>
            <button
              onClick={() => cancelStream(entry.key)}
              className="font-mono text-[10px] px-2 py-1 border border-red-500/40 text-red-400
                         hover:bg-red-500/10 rounded-sm uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
      {streams.length > 3 && (
        <div className="pointer-events-auto text-center font-mono text-[10px] text-neutral-600">
          +{streams.length - 3} more running
        </div>
      )}
    </div>,
    document.body
  )
}
