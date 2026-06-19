export default function KillChainControls({ playing, onPlay, onReset, speed, onSpeedChange, mode, onModeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Play / Reset */}
      <div className="flex items-center gap-2">
        {!playing ? (
          <button
            onClick={onPlay}
            className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5
                       bg-accent/15 border border-accent/40 text-accent
                       hover:bg-accent/25 rounded-sm uppercase tracking-widest transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play Sequence
          </button>
        ) : (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5
                       bg-red-500/10 border border-red-500/40 text-red-400
                       hover:bg-red-500/20 rounded-sm uppercase tracking-widest transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Speed */}
      <div className="flex items-center gap-1.5 font-mono text-[10px]">
        <span className="text-neutral-600 uppercase tracking-widest">Speed</span>
        {['slow', 'normal', 'fast'].map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 border rounded-sm uppercase tracking-wider transition-colors ${
              speed === s
                ? 'border-accent/50 text-accent bg-accent/10'
                : 'border-border text-neutral-600 hover:text-neutral-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Mode toggle (atk/def) */}
      {onModeChange && (
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-neutral-600 uppercase tracking-widest">Mode</span>
          <div className="flex rounded-sm overflow-hidden border border-border/60">
            {['attack', 'defense'].map(m => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
                  mode === m
                    ? m === 'attack'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-green-500/15 text-green-400'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                {m === 'attack' ? 'ATK' : 'DEF'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
