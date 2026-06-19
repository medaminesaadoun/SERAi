import { motion, AnimatePresence } from 'framer-motion'
import KillChainNode from './KillChainNode'

export default function KillChainStage({ stage, scenarios, mode, isActive, isRevealed, onScenarioClick, onMitreClick, index = 0 }) {
  const stageColor = stage.color

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isRevealed ? 1 : 0.15, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-[220px] flex flex-col"
    >
      {/* Stage header */}
      <div
        className="relative px-3 py-2.5 mb-3 border rounded-sm shrink-0"
        style={{
          borderColor: `${stageColor}40`,
          background: `linear-gradient(135deg, ${stageColor}12 0%, ${stageColor}04 100%)`,
          boxShadow: isActive ? `0 0 24px ${stageColor}33` : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${stageColor}20`, border: `1px solid ${stageColor}50` }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke={stageColor} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={stage.icon} />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: stageColor }}>
              {stage.id}
            </div>
            <div className="font-bold text-xs text-neutral-100 truncate">{stage.name}</div>
          </div>
        </div>
        <div className="absolute -top-px left-3 right-3 h-px" style={{
          background: `linear-gradient(90deg, transparent, ${stageColor}80, transparent)`,
        }} />
      </div>

      {/* Scenarios list */}
      <div className="flex-1 space-y-2 min-h-[100px]">
        <AnimatePresence>
          {scenarios.map((scenario, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <KillChainNode
                scenario={scenario}
                onClick={onScenarioClick}
                onMitreClick={onMitreClick}
                mode={mode}
                index={i}
                isVisible={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
