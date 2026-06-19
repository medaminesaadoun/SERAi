import { motion, AnimatePresence } from 'framer-motion'

const ICONS = {
  pending:   '○',
  started:   '◐',
  completed: '✓',
  failed:    '✕',
  cancelled: '⊘',
}

const COLORS = {
  pending:   '#737373',
  started:   'rgb(var(--color-accent))',
  completed: '#22c55e',
  failed:    '#ef4444',
  cancelled: '#eab308',
}

function TaskRow({ task, index }) {
  const isActive = task.status === 'started'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-center gap-3 py-1.5"
    >
      <span
        className="w-5 h-5 flex items-center justify-center font-mono text-sm shrink-0"
        style={{
          color: COLORS[task.status] || COLORS.pending,
        }}
      >
        {isActive ? (
          <span
            className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
            style={{
              borderColor: `${COLORS[task.status]} transparent ${COLORS[task.status]} ${COLORS[task.status]}`,
            }}
          />
        ) : (
          ICONS[task.status] || ICONS.pending
        )}
      </span>
      <span
        className="font-mono text-xs flex-1 truncate"
        style={{
          color: task.status === 'pending' ? '#737373' : '#d4d4d4',
        }}
      >
        {task.label}
      </span>
      {task.elapsedMs != null && (
        <span className="font-mono text-[10px] text-neutral-600 shrink-0">
          {task.elapsedMs < 1000 ? `${task.elapsedMs}ms` : `${(task.elapsedMs / 1000).toFixed(1)}s`}
        </span>
      )}
      {task.status === 'failed' && task.error && (
        <span className="font-mono text-[10px] text-red-400 shrink-0 max-w-[200px] truncate" title={task.error}>
          {task.error}
        </span>
      )}
    </motion.div>
  )
}

export default function TaskProgress({
  tasks = [],
  streaming = false,
  onCancel = null,
  showCancel = true,
  cancelLabel = 'Cancel',
  compact = false,
}) {
  if (tasks.length === 0 && !streaming) return null

  return (
    <div className={`font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className={`space-y-0.5 ${compact ? '' : 'border-l border-border/40 pl-3'}`}>
        <AnimatePresence>
          {tasks.map((t, i) => (
            <TaskRow key={t.id} task={t} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {showCancel && streaming && onCancel && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onCancel}
          className="mt-3 px-3 py-1.5 border border-red-500/40 text-red-400
                     hover:bg-red-500/10 hover:border-red-500/60 rounded-sm
                     uppercase tracking-widest text-[10px] font-mono
                     transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {cancelLabel}
        </motion.button>
      )}
    </div>
  )
}
