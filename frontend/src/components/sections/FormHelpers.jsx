/* Shared UI helpers for the OSINT form sections */

/**
 * Wrap a label + input/textarea + FieldHint in this.
 * The hint is hidden by default and fades in on :focus-within (CSS only).
 */
export function FieldGroup({ children, className = '' }) {
  return <div className={`field-group ${className}`}>{children}</div>
}

/**
 * Hidden by default — revealed via .field-group:focus-within CSS rule.
 * For non-focusable contexts (checkboxes), pass always={true} to keep it visible.
 */
export function FieldHint({ children, always = false }) {
  return (
    <p className={`field-hint text-xs text-neutral-500 leading-relaxed flex gap-1.5 ${always ? 'field-hint--always' : ''}`}>
      <span className="shrink-0 mt-px" style={{ color: 'rgb(var(--color-accent) / 0.45)' }}>ℹ</span>
      <span>{children}</span>
    </p>
  )
}

/**
 * Section completion bar.
 * values: array of anything — a value "counts" if it's truthy, or > 0 for arrays.
 */
export function SectionProgress({ values }) {
  const filled = values.filter(v =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  ).length
  const total  = values.length
  const pct    = total === 0 ? 0 : (filled / total) * 100
  const color  = pct >= 70 ? '#22c55e' : pct >= 35 ? '#eab308' : '#ef4444'

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums" style={{ color }}>
        {filled}/{total}
      </span>
    </div>
  )
}

/** Collapsible OSINT resource panel at the bottom of a section */
export function OsintResources({ tools }) {
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer list-none flex items-center gap-2 font-mono text-xs text-neutral-600 hover:text-neutral-400 transition-colors select-none">
        <span className="transition-transform duration-200 group-open:rotate-90 inline-block">▶</span>
        OSINT resources for this section
      </summary>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tools.map(({ name, url, desc }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-0.5 px-3 py-2 rounded-sm border transition-colors duration-150
                       border-border/50 hover:border-accent/30 bg-black/20 hover:bg-accent/5 group/link"
          >
            <span className="font-mono text-xs font-bold text-neutral-300 group-hover/link:text-accent transition-colors">
              {name} ↗
            </span>
            <span className="text-xs text-neutral-600">{desc}</span>
          </a>
        ))}
      </div>
    </details>
  )
}
