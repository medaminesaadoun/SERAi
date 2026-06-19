import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKillChainMapping } from '../../hooks/useKillChainMapping'
import { MITRE_TACTICS, TACTICS_BY_ID } from '../../data/mitreTactics'
import KillChainStage from './KillChainStage'
import KillChainConnector from './KillChainConnector'
import KillChainControls from './KillChainControls'
import KillChainLegend from './KillChainLegend'

const SPEED_DELAYS = { slow: 1200, normal: 700, fast: 350 }

export default function KillChainDiagram({ scenarios = [], mode = 'attack', onScenarioClick, onMitreClick }) {
  const { stages, unmapped, hasData } = useKillChainMapping(scenarios)
  const [playing, setPlaying]         = useState(false)
  const [revealedCount, setRevealed]  = useState(stages.length)
  const [speed, setSpeed]             = useState('normal')
  const scrollRef                     = useRef(null)
  const timerRef                      = useRef(null)

  useEffect(() => {
    if (!playing) return
    if (revealedCount >= stages.length) {
      setPlaying(false)
      return
    }
    timerRef.current = setTimeout(() => {
      setRevealed(c => Math.min(c + 1, stages.length))
    }, SPEED_DELAYS[speed])
    return () => clearTimeout(timerRef.current)
  }, [playing, revealedCount, stages.length, speed])

  useEffect(() => {
    setRevealed(stages.length)
    setPlaying(false)
  }, [scenarios, stages.length])

  function handlePlay() {
    setRevealed(1)
    setPlaying(true)
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }, 100)
  }

  function handleReset() {
    setPlaying(false)
    setRevealed(stages.length)
  }

  function handleMitre(id) {
    if (onMitreClick) {
      onMitreClick(id)
    } else {
      window.open(`https://attack.mitre.org/techniques/${id.replace('.', '/')}`, '_blank')
    }
  }

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <div className="font-mono text-xs text-neutral-600 uppercase tracking-widest">
          No attack scenarios mapped to MITRE tactics yet
        </div>
      </div>
    )
  }

  const isAtk = mode === 'attack'
  const flowColor = isAtk ? '#ef4444' : '#3b82f6'

  return (
    <div className="space-y-4">
      {/* Header bar with controls and legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest shrink-0">
            // Attack Flow
          </div>
          <div className="text-xs text-neutral-500 font-mono">
            {stages.length} {stages.length === 1 ? 'stage' : 'stages'} ·{' '}
            {stages.reduce((sum, s) => sum + s.scenarios.length, 0)} scenarios
          </div>
        </div>
        <KillChainLegend />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <KillChainControls
          playing={playing}
          onPlay={handlePlay}
          onReset={handleReset}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Scrollable diagram */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden pb-4 -mx-2 px-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex items-stretch min-w-max gap-0">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-stretch">
              <KillChainStage
                stage={stage}
                scenarios={stage.scenarios}
                mode={mode}
                isActive={playing && i < revealedCount}
                isRevealed={!playing || i < revealedCount}
                onScenarioClick={onScenarioClick}
                onMitreClick={handleMitre}
                index={i}
              />
              {i < stages.length - 1 && (
                <KillChainConnector
                  color={flowColor}
                  active={playing && i < revealedCount - 1}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unmapped scenarios fallback */}
      {unmapped.length > 0 && (
        <details className="border border-border/40 rounded-sm px-3 py-2 bg-white/2">
          <summary className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-neutral-300">
            {unmapped.length} scenario{unmapped.length === 1 ? '' : 's'} without MITRE mapping
          </summary>
          <div className="mt-3 space-y-2">
            {unmapped.map((s, i) => (
              <div key={i}
                onClick={() => onScenarioClick && onScenarioClick(s)}
                className="text-xs p-2.5 bg-white/3 border border-border/40 rounded-sm cursor-pointer
                           hover:border-accent/40 transition-colors">
                <div className="font-semibold text-neutral-200 mb-1">{s.title}</div>
                <div className="text-neutral-600 text-[10px] font-mono">{s.mitre_technique}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Play progress bar */}
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 px-1"
          >
            <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest shrink-0">
              Playing
            </div>
            <div className="flex-1 h-0.5 bg-border/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: flowColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(revealedCount / stages.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="font-mono text-[10px] text-neutral-500 shrink-0">
              {revealedCount}/{stages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
