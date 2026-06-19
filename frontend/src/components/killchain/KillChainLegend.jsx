export default function KillChainLegend() {
  const items = [
    { label: 'Critical', color: '#dc2626' },
    { label: 'High',     color: '#ef4444' },
    { label: 'Medium',   color: '#eab308' },
    { label: 'Low',      color: '#22c55e' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
      <span className="text-neutral-600 uppercase tracking-widest">Risk</span>
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          <span className="text-neutral-500 uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  )
}
