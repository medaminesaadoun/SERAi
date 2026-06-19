import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIStore } from '../context/AIStoreContext'

function StatusIcon({ status }) {
  if (status === 'completed') {
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'failed') {
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  if (status === 'cancelled') {
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M5 5l14 14" />
      </svg>
    )
  }
  if (status === 'started') {
    return (
      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
      </svg>
    )
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
}

function TaskRow({ task }) {
  const colorByStatus = {
    completed: 'text-green-400',
    failed:    'text-red-400',
    cancelled: 'text-yellow-400',
    started:   'text-accent',
    pending:   'text-neutral-600',
  }
  const color = colorByStatus[task.status] || 'text-neutral-500'
  return (
    <div className="flex items-center gap-2 py-1 px-2 text-xs font-mono">
      <span className={`${color} shrink-0 w-4 flex justify-center`}>
        <StatusIcon status={task.status} />
      </span>
      <span className="flex-1 truncate text-neutral-300">{task.label}</span>
      {task.elapsedMs != null && (
        <span className="text-neutral-600 shrink-0">{formatMs(task.elapsedMs)}</span>
      )}
    </div>
  )
}

function formatMs(ms) {
  if (ms == null) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function OpSummary({ op, onCancel }) {
  const activeTask = (op.tasks || []).find(t => t.status === 'started')
  const completed = (op.tasks || []).filter(t => t.status === 'completed').length
  const total     = (op.tasks || []).length
  const isAtk = op.kind === 'attack'

  let summary = activeTask ? activeTask.label : op.label
  if (op.tokenCount > 0) {
    summary = `${activeTask ? activeTask.label : op.label} · ${op.tokenCount.toLocaleString()} tokens`
  }
  const elapsed = op.ts ? Date.now() - op.ts : 0

  return (
    <div className="flex items-center gap-3 w-full">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${op.streaming ? 'bg-accent animate-pulse' : 'bg-neutral-500'}`} />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 shrink-0">
          {op.kind}
        </span>
        <span className="text-xs text-neutral-200 truncate">{summary}</span>
        {total > 0 && (
          <span className="font-mono text-[10px] text-neutral-600 shrink-0">
            {completed}/{total}
          </span>
        )}
      </div>
      {op.streaming && elapsed > 0 && (
        <span className="font-mono text-[10px] text-neutral-500 shrink-0">
          {formatMs(elapsed)}
        </span>
      )}
      {op.streaming && (
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(op.id) }}
          className="font-mono text-[10px] px-2.5 py-1 border border-red-500/40 text-red-400
                     hover:bg-red-500/15 rounded-sm uppercase tracking-widest transition-colors shrink-0"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

function CollapsedBar({ ops, onExpand, onCancel, compact = false }) {
  const list = Object.values(ops)
  const streaming = list.filter(op => op.streaming)
  const isMulti   = streaming.length > 1

  let left, right
  if (isMulti) {
    left = (
      <span className="font-mono text-xs text-neutral-200 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        {streaming.length} AI operations running
      </span>
    )
    right = (
      <div className="flex items-center gap-2">
        <button
          onClick={onExpand}
          className="font-mono text-[10px] px-2.5 py-1 border border-border text-neutral-400
                     hover:text-accent hover:border-accent/40 rounded-sm uppercase tracking-widest
                     transition-colors"
        >
          Show
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); streaming.forEach(op => onCancel(op.id)) }}
          className="font-mono text-[10px] px-2.5 py-1 border border-red-500/40 text-red-400
                     hover:bg-red-500/15 rounded-sm uppercase tracking-widest transition-colors"
        >
          Cancel All
        </button>
      </div>
    )
  } else if (streaming.length === 1) {
    left = <OpSummary op={streaming[0]} onCancel={onCancel} />
    right = (
      <button
        onClick={onExpand}
        className="font-mono text-[10px] px-2 py-1 text-neutral-500 hover:text-accent
                   uppercase tracking-widest transition-colors shrink-0"
        title="Expand"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    )
  } else {
    // All ops just finished, persisting briefly
    const last = list[list.length - 1]
    left = (
      <span className="font-mono text-xs text-neutral-400 flex items-center gap-2">
        <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Completed
      </span>
    )
    right = null
  }

  return (
    <button
      onClick={onExpand}
      className={`w-full flex items-center justify-between gap-3 px-4 ${compact ? 'py-1.5' : 'py-3'} bg-bg/95 backdrop-blur-md border-b border-accent/40 text-left`}
      style={{ boxShadow: '0 6px 28px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
    >
      {left}
      {right}
    </button>
  )
}

function ExpandedPanel({ ops, onCollapse, onCancel }) {
  const list = Object.values(ops)
  return (
    <div
      className="bg-bg/97 backdrop-blur-md border-b border-accent/30"
      style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">// AI Activity</span>
          <span className="font-mono text-[10px] text-neutral-600">{list.length} operation{list.length === 1 ? '' : 's'}</span>
        </div>
        <button
          onClick={onCollapse}
          className="font-mono text-[10px] text-neutral-500 hover:text-accent uppercase tracking-widest
                     transition-colors flex items-center gap-1"
        >
          Hide
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto py-2">
        {list.map(op => (
          <div key={op.id} className="border-b border-border/30 last:border-b-0 pb-2 mb-2 last:mb-0">
            <div className="flex items-center justify-between gap-3 px-4 py-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 shrink-0">
                  {op.kind}
                </span>
                <span className="text-sm text-neutral-200 truncate">{op.label}</span>
                {op.tokenCount > 0 && (
                  <span className="font-mono text-[10px] text-neutral-600 shrink-0">
                    {op.tokenCount.toLocaleString()} tok
                  </span>
                )}
              </div>
              {op.streaming && (
                <button
                  onClick={() => onCancel(op.id)}
                  className="font-mono text-[10px] px-2 py-1 border border-red-500/40 text-red-400
                             hover:bg-red-500/15 rounded-sm uppercase tracking-widest transition-colors shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>
            {(op.tasks || []).length > 0 && (
              <div className="px-2">
                {op.tasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AIActivityBar() {
  const { ops, cancel } = useAIStore()
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef(null)
  const hasOps = Object.keys(ops).length > 0

  // Auto-collapse when all ops finish
  useEffect(() => {
    if (!hasOps) {
      setExpanded(false)
    }
  }, [hasOps])

  // Click-outside to collapse
  useEffect(() => {
    if (!expanded) return
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [expanded])

  const streamingCount = Object.values(ops).filter(op => op.streaming).length
  const compact = !expanded && streamingCount === 1

  return (
    <AnimatePresence>
      {hasOps && (
        <motion.div
          ref={containerRef}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="sticky z-[55] overflow-hidden"
          style={{ top: '64px' }}
        >
          {expanded
            ? <ExpandedPanel ops={ops} onCollapse={() => setExpanded(false)} onCancel={cancel} />
            : <CollapsedBar ops={ops} onExpand={() => setExpanded(true)} onCancel={cancel} compact={compact} />
          }
        </motion.div>
      )}
    </AnimatePresence>
  )
}
