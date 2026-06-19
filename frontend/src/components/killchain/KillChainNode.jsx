import { getRiskColor, getRiskLabel } from '../../hooks/useKillChainMapping'

export default function KillChainNode({ scenario, onClick, onMitreClick, mode, index = 0, isVisible = true }) {
  if (!isVisible) return null

  const riskColor = getRiskColor(scenario.likelihood, scenario.impact)
  const riskLabel = getRiskLabel(scenario.likelihood, scenario.impact)
  const mitreId = (scenario.mitre_technique || '').split(' - ')[0].trim()

  return (
    <div
      onClick={() => onClick && onClick(scenario)}
      className="group relative p-3 bg-white/3 border border-border/60 rounded-sm cursor-pointer
                 hover:border-accent/40 hover:bg-white/5 transition-all duration-200
                 hover:shadow-lg"
      style={{
        borderLeft: `3px solid ${riskColor}`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="font-bold text-xs text-neutral-200 leading-snug mb-1.5 line-clamp-2">
        {scenario.title}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span
          className="font-mono text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-bold"
          style={{
            backgroundColor: `${riskColor}22`,
            color: riskColor,
            border: `1px solid ${riskColor}44`,
          }}
        >
          {riskLabel}
        </span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-white/5 text-neutral-500 border border-border/50 uppercase">
          {scenario.type}
        </span>
      </div>

      {mitreId && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMitreClick && onMitreClick(mitreId)
          }}
          className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors
                     flex items-center gap-1 group/m"
          title={`Open ${mitreId} on MITRE ATT&CK`}
        >
          <span>{mitreId}</span>
          <svg className="w-2.5 h-2.5 opacity-50 group-hover/m:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      )}

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </div>
  )
}
