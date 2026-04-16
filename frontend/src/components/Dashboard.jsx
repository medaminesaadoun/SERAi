import { useState, useEffect, useRef } from 'react'
import RadarChart from './RadarChart'
import { useToast } from '../context/ToastContext'

const RISK_COLORS = {
  LOW:      { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  hex: '#22c55e' },
  MEDIUM:   { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', hex: '#eab308' },
  HIGH:     { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', hex: '#f97316' },
  CRITICAL: { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    hex: '#ef4444' },
}
const TARGET_COLORS = { MAX: RISK_COLORS.CRITICAL, ...RISK_COLORS }

/* ── Animated circular score ring ──────────────────────────── */
function ScoreRing({ score, riskColor }) {
  const radius        = 52
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset]   = useState(circumference)
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference)
      const duration = 1400
      const start = performance.now()
      function tick(now) {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(Math.round(eased * score))
        if (p < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, 120)
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current) }
  }, [score, circumference])

  return (
    <div className="relative w-44 h-44 mx-auto float">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        <circle cx="60" cy="60" r={radius} fill="none"
                stroke={riskColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)',
                         filter: `blur(6px) drop-shadow(0 0 10px ${riskColor})`, opacity: 0.4 }}/>
        <circle cx="60" cy="60" r={radius} fill="none"
                stroke={riskColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono font-black text-5xl leading-none" style={{ color: riskColor }}>{display}</div>
        <div className="font-mono text-xs text-neutral-600 mt-1">/100</div>
      </div>
    </div>
  )
}

/* ── Animated score bar ────────────────────────────────────── */
function AnimatedBar({ label, value, delay }) {
  const color = value >= 75 ? '#ef4444' : value >= 50 ? '#f97316' : value >= 25 ? '#eab308' : '#22c55e'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-neutral-400">{label}</span>
        <span className="font-mono font-bold tabular-nums" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full animated-bar"
             style={{ '--bar-w': `${value}%`, '--bar-delay': delay, background: color }} />
      </div>
    </div>
  )
}

/* ── Section header with ghosted number ────────────────────── */
function Section({ title, prefix, children, delay = '0s' }) {
  const num = prefix.replace('// ', '')
  return (
    <div className="mb-10 fade-in-up" style={{ animationDelay: delay }}>
      <div className="relative flex items-center gap-4 mb-6 pb-4 overflow-hidden"
           style={{ borderBottom: '1px solid rgb(var(--color-border) / 0.5)' }}>
        {/* Ghost number */}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono font-black select-none pointer-events-none leading-none"
              style={{ fontSize: '5.5rem', color: 'rgb(var(--color-accent) / 0.06)' }}>
          {num}
        </span>
        <span className="font-mono text-xs shrink-0" style={{ color: 'rgb(var(--color-accent) / 0.75)' }}>
          {prefix}
        </span>
        <div className="w-px h-3.5 shrink-0" style={{ backgroundColor: 'rgb(var(--color-border))' }} />
        <h2 className="font-display text-sm font-bold tracking-widest uppercase text-neutral-300 shrink-0">{title}</h2>
        <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right, rgb(var(--color-border) / 0.6), transparent)' }} />
      </div>
      {children}
    </div>
  )
}

/* ── Likelihood × Impact threat matrix ─────────────────────── */
function ThreatMatrix({ likelihood, impact }) {
  const liRows = ['HIGH', 'MEDIUM', 'LOW']
  const impCols = ['LOW', 'MEDIUM', 'HIGH']
  const ri = liRows.indexOf(likelihood)
  const ci = impCols.indexOf(impact)

  // Severity of the active cell
  const score = (2 - ri) + ci  // 0–4
  const activeColor = score >= 4 ? '#ef4444' : score >= 3 ? '#f97316' : score >= 2 ? '#eab308' : '#22c55e'

  return (
    <div className="shrink-0 flex flex-col items-center gap-1"
         title={`Likelihood: ${likelihood} · Impact: ${impact}`}>
      <div className="grid grid-cols-3 gap-0.5">
        {liRows.map((row, r) =>
          impCols.map((col, c) => {
            const active = r === ri && c === ci
            return (
              <div key={`${r}-${c}`}
                   className="w-2.5 h-2.5 rounded-sm transition-all duration-300"
                   style={{
                     backgroundColor: active ? activeColor : 'rgba(255,255,255,0.06)',
                     boxShadow: active ? `0 0 6px ${activeColor}99` : 'none',
                   }} />
            )
          })
        )}
      </div>
      <span className="font-mono text-neutral-700" style={{ fontSize: '8px' }}>L·I MATRIX</span>
    </div>
  )
}

/* ── Main dashboard ────────────────────────────────────────── */
export default function Dashboard({ analysis, onNewAnalysis }) {
  const { id, timestamp, company_name, result } = analysis
  const { toast } = useToast()

  const riskStyle     = RISK_COLORS[result.risk_level] || RISK_COLORS.MEDIUM
  const formattedDate = (() => { try { return new Date(timestamp).toLocaleString() } catch { return timestamp } })()

  function downloadPdf() {
    // Opens the printable HTML report in a new tab — use Ctrl+P / Save as PDF
    window.open(`/api/analyses/${id}/report`, '_blank')
  }

  const priorityColor = (p) =>
    p === 1 ? '#ef4444' : p === 2 ? '#f97316' : p === 3 ? '#eab308' : 'rgb(var(--color-accent))'

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Demo banner ── */}
      {analysis._isDemo && (
        <div className="mb-6 px-4 py-2.5 border flex items-center gap-3 fade-in-up"
             style={{ borderColor: 'rgba(234,179,8,0.25)', backgroundColor: 'rgba(234,179,8,0.04)' }}>
          <span className="font-mono text-xs font-bold text-yellow-400 shrink-0 uppercase tracking-widest">Demo</span>
          <div className="w-px h-3 bg-yellow-500/30 shrink-0" />
          <span className="text-xs text-yellow-400/60">Simulated data — no real analysis was performed</span>
        </div>
      )}

      {/* ── Briefing Header ── */}
      <div className="mb-8 fade-in-up">
        {/* Top meta row */}
        <div className="flex items-center gap-3 mb-3 font-mono text-xs text-neutral-600">
          <span className="uppercase tracking-widest" style={{ color: 'rgb(var(--color-accent) / 0.6)' }}>
            // Threat Assessment
          </span>
          <span>·</span>
          <span>{formattedDate}</span>
          <span>·</span>
          <span className="hidden sm:inline">ID {id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* Main header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{company_name}</h1>
            {/* Risk level badge — prominent in header */}
            <div className={`shrink-0 font-mono font-bold text-xs tracking-widest px-3 py-1.5 border ${riskStyle.border} ${riskStyle.bg} ${riskStyle.text}`}
                 style={{ boxShadow: `0 0 16px ${riskStyle.hex}22` }}>
              {result.risk_level}
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button onClick={onNewAnalysis} className="serai-btn-secondary text-xs">← New</button>
            <button onClick={downloadPdf} className="serai-btn-primary text-xs">
              ↓ PDF Report
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-4 h-px" style={{ background: `linear-gradient(to right, ${riskStyle.hex}44, rgb(var(--color-border) / 0.4), transparent)` }} />
      </div>

      {/* ── Score + Radar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 fade-in-up" style={{ animationDelay: '0.05s' }}>

        {/* Score card */}
        <div className="serai-card p-6" style={{ borderLeftWidth: 3, borderLeftColor: riskStyle.hex }}>
          <div className="font-mono text-xs uppercase tracking-widest mb-5"
               style={{ color: 'rgb(var(--color-accent) / 0.6)' }}>
            Global Risk Score
          </div>
          <ScoreRing score={result.global_score} riskColor={riskStyle.hex} />

          {/* Mini stat row */}
          <div className="grid grid-cols-3 gap-3 my-5">
            {[
              ['Targets',   result.priority_targets?.length ?? '—'],
              ['Scenarios', result.attack_scenarios?.length ?? '—'],
              ['Rec.',      result.recommendations?.length  ?? '—'],
            ].map(([label, val]) => (
              <div key={label} className="text-center">
                <div className="font-mono font-black text-xl" style={{ color: riskStyle.hex }}>{val}</div>
                <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgb(var(--color-border) / 0.4)' }}>
            {[
              ['People',            result.dimension_scores.people,           '0.3s'],
              ['Technology',        result.dimension_scores.technology,       '0.4s'],
              ['Processes',         result.dimension_scores.processes,        '0.5s'],
              ['Digital Footprint', result.dimension_scores.digital_footprint,'0.6s'],
            ].map(([label, val, d]) => (
              <AnimatedBar key={label} label={label} value={val} delay={d} />
            ))}
          </div>
        </div>

        {/* Radar card */}
        <div className="serai-card p-6 flex flex-col items-center justify-center">
          <div className="font-mono text-xs uppercase tracking-widest mb-5"
               style={{ color: 'rgb(var(--color-accent) / 0.6)' }}>
            Dimension Radar
          </div>
          <RadarChart scores={result.dimension_scores} />
        </div>
      </div>

      {/* ── Executive Summary ── */}
      <Section title="Executive Summary" prefix="// 01" delay="0.12s">
        <div className="serai-card p-6" style={{ borderLeftWidth: 3, borderLeftColor: riskStyle.hex }}>
          {/* Stat chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: 'Score',     val: `${result.global_score}/100`,                      color: riskStyle.hex },
              { label: 'Risk',      val: result.risk_level,                                  color: riskStyle.hex },
              { label: 'Targets',   val: `${result.priority_targets?.length ?? 0} identified`, color: null },
              { label: 'Scenarios', val: `${result.attack_scenarios?.length ?? 0} mapped`,     color: null },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center gap-1.5 font-mono text-xs border px-2.5 py-1"
                   style={{
                     borderColor: color ? `${color}44` : 'rgb(var(--color-border) / 0.5)',
                     backgroundColor: color ? `${color}0d` : 'rgb(var(--color-card))',
                     color: color || 'rgb(163 163 163)',
                   }}>
                <span className="text-neutral-600 uppercase tracking-wider">{label}</span>
                <span className="w-px h-3 bg-current opacity-20" />
                <span className="font-bold">{val}</span>
              </div>
            ))}
          </div>
          <p className="text-neutral-300 leading-relaxed text-sm">{result.executive_summary}</p>
        </div>
      </Section>

      {/* ── Priority Targets ── */}
      <Section title="Priority Targets" prefix="// 02" delay="0.18s">
        <div className="space-y-3">
          {result.priority_targets.map((target, i) => {
            const ts = TARGET_COLORS[target.risk_level] || TARGET_COLORS.MEDIUM
            return (
              <div key={i} className="serai-card overflow-hidden fade-in-up"
                   style={{ animationDelay: `${0.2 + i * 0.07}s`, borderLeftWidth: 3, borderLeftColor: ts.hex }}>
                {/* Target header */}
                <div className="flex items-center justify-between gap-4 px-5 py-4"
                     style={{ borderBottom: '1px solid rgb(var(--color-border) / 0.4)' }}>
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs font-bold shrink-0" style={{ color: `${ts.hex}99` }}>
                      T·{String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-base leading-tight">{target.name}</div>
                      <div className="text-neutral-500 text-xs mt-0.5 font-mono truncate">{target.role}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${target.risk_level.toLowerCase()} shrink-0`}>
                    {target.risk_level}
                  </span>
                </div>

                {/* Attack vectors + protection */}
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mb-2">Attack Vectors</div>
                    <div className="flex flex-wrap gap-1.5">
                      {target.attack_vectors.map((v, j) => (
                        <span key={j} className="font-mono text-xs px-2 py-0.5 rounded-sm"
                              style={{
                                backgroundColor: `${ts.hex}10`,
                                border: `1px solid ${ts.hex}33`,
                                color: ts.hex,
                              }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgb(var(--color-border) / 0.3)', paddingTop: '0.75rem' }}>
                    <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mb-1.5">Mitigation</div>
                    <p className="text-sm text-neutral-400 leading-relaxed">{target.protection}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Attack Scenarios ── */}
      <Section title="Attack Scenarios" prefix="// 03" delay="0.24s">
        <div className="grid gap-3">
          {result.attack_scenarios.map((s, i) => (
            <div key={i} className="serai-card p-5 fade-in-up"
                 style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
              {/* Top row: title + matrix + MITRE */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base mb-2 leading-snug">{s.title}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs bg-white/5 text-neutral-400 border border-border/50 px-2 py-0.5 uppercase">
                      {s.type}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5"
                          style={{
                            backgroundColor: 'rgb(var(--color-accent) / 0.05)',
                            border: '1px solid rgb(var(--color-accent) / 0.2)',
                            color: 'rgb(var(--color-accent))',
                          }}>
                      {s.mitre_technique}
                    </span>
                  </div>
                </div>
                {/* Threat matrix */}
                <ThreatMatrix likelihood={s.likelihood} impact={s.impact} />
              </div>

              <p className="text-sm text-neutral-400 leading-relaxed mb-4">{s.description}</p>

              {/* Likelihood / impact pills */}
              <div className="flex gap-3">
                {[
                  { label: 'Likelihood', val: s.likelihood },
                  { label: 'Impact',     val: s.impact },
                ].map(({ label, val }) => {
                  const c = val === 'HIGH' ? '#ef4444' : val === 'MEDIUM' ? '#eab308' : '#22c55e'
                  return (
                    <div key={label} className="flex items-center gap-1.5 font-mono text-xs"
                         style={{ color: c }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                      <span className="text-neutral-600">{label}:</span>
                      <span className="font-bold">{val}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Recommendations ── */}
      <Section title="Recommendations" prefix="// 04" delay="0.30s">
        <div className="space-y-3">
          {result.recommendations.map((rec, i) => {
            const pColor = priorityColor(rec.priority)
            return (
              <div key={i} className="serai-card overflow-hidden fade-in-up"
                   style={{ animationDelay: `${0.3 + i * 0.06}s` }}>
                {/* Urgency bar */}
                <div className="h-0.5 w-full" style={{ backgroundColor: `${pColor}33` }}>
                  <div className="h-full transition-all duration-700"
                       style={{ width: `${Math.max(20, 100 - (rec.priority - 1) * 18)}%`, backgroundColor: pColor }} />
                </div>

                <div className="flex gap-5 p-5">
                  {/* Priority number */}
                  <div className="shrink-0 text-center" style={{ minWidth: '2.5rem' }}>
                    <div className="font-mono font-black text-2xl leading-none" style={{ color: pColor }}>
                      {String(rec.priority).padStart(2, '0')}
                    </div>
                    <div className="font-mono text-neutral-700 mt-1" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>
                      PRIORITY
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base mb-1.5">{rec.title}</div>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-2.5">{rec.description}</p>
                    <div className="font-mono text-xs" style={{ color: 'rgb(var(--color-accent2))' }}>
                      {rec.mitre_mitigation}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between font-mono text-xs text-neutral-700 py-4 fade-in-up"
           style={{ animationDelay: '0.4s', borderTop: '1px solid rgb(var(--color-border) / 0.3)' }}>
        <span>Analysis ID: <span className="text-neutral-600">{id}</span></span>
        <span>Generated locally · No data transmitted externally</span>
      </div>
    </div>
  )
}
