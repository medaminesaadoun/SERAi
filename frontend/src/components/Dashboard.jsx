import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import RadarChart from './RadarChart'
import { useToast } from '../context/ToastContext'

const RISK_COLORS = {
  LOW:      { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  hex: '#22c55e' },
  MEDIUM:   { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', hex: '#eab308' },
  HIGH:     { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', hex: '#f97316' },
  CRITICAL: { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    hex: '#ef4444' },
}
const TARGET_COLORS = { MAX: RISK_COLORS.CRITICAL, ...RISK_COLORS }

/* ── Helpers ────────────────────────────────────────────────── */
function extractKeyFinding(summary) {
  if (!summary) return null
  const match = summary.match(/^.*?[.!?]/)
  return match ? match[0] : summary.slice(0, 140)
}

function weakestDimension(dims) {
  const labels = { people: 'People', technology: 'Technology', processes: 'Processes', digital_footprint: 'Digital Footprint' }
  const [key, score] = Object.entries(dims).reduce((a, b) => b[1] > a[1] ? b : a)
  return { label: labels[key] || key, score }
}

function recTimeframe(priority) {
  if (priority === 1) return { label: 'Immediate',  color: '#ef4444' }
  if (priority === 2) return { label: 'Short-term', color: '#f97316' }
  if (priority === 3) return { label: 'Planned',    color: '#eab308' }
  return                      { label: 'Strategic', color: '#22c55e' }
}

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
    <div className="relative w-36 h-36 mx-auto float">
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
        <div className="font-mono font-black text-4xl leading-none" style={{ color: riskColor }}>{display}</div>
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
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-500">{label}</span>
        <span className="font-mono font-bold tabular-nums" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full animated-bar"
             style={{ '--bar-w': `${value}%`, '--bar-delay': delay, background: color }} />
      </div>
    </div>
  )
}

/* ── Tile header ────────────────────────────────────────────── */
function TileHeader({ label, prefix }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3"
         style={{ borderBottom: '1px solid rgb(var(--color-border) / 0.5)' }}>
      <span className="font-mono text-xs shrink-0" style={{ color: 'rgb(var(--color-accent) / 0.6)' }}>{prefix}</span>
      <div className="w-px h-3 shrink-0" style={{ backgroundColor: 'rgb(var(--color-border))' }} />
      <h2 className="font-display text-xs font-bold tracking-widest uppercase text-neutral-300">{label}</h2>
    </div>
  )
}

/* ── Likelihood × Impact threat matrix ─────────────────────── */
function ThreatMatrix({ likelihood, impact }) {
  const liRows = ['HIGH', 'MEDIUM', 'LOW']
  const impCols = ['LOW', 'MEDIUM', 'HIGH']
  const ri = liRows.indexOf(likelihood)
  const ci = impCols.indexOf(impact)
  const score = (2 - ri) + ci
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

/* ── Expandable target card (mode-driven) ───────────────────── */
function TargetCard({ target, index, delay, mode }) {
  const [expanded, setExpanded] = useState(false)
  const ts = TARGET_COLORS[target.risk_level] || TARGET_COLORS.MEDIUM
  const isAtk = mode === 'attack'

  return (
    <div className="rounded-sm overflow-hidden fade-in-up"
         style={{ animationDelay: delay, border: '1px solid rgb(var(--color-border) / 0.5)', borderLeftWidth: 3, borderLeftColor: ts.hex }}>

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{
          backgroundColor: `${ts.hex}06`,
          borderBottom: expanded ? '1px solid rgb(var(--color-border) / 0.3)' : 'none',
          transition: 'background-color 0.15s',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs font-bold shrink-0" style={{ color: `${ts.hex}99` }}>
            T·{String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight truncate">{target.name}</div>
            <div className="text-neutral-500 text-xs mt-0.5 font-mono truncate">{target.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge badge-${target.risk_level.toLowerCase()}`}>{target.risk_level}</span>
          <span className="font-mono text-neutral-600 text-xs"
                style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3">
          {isAtk ? (
            <>
              <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mb-2">Exposure Points</div>
              <div className="flex flex-wrap gap-1.5">
                {target.attack_vectors.map((v, j) => (
                  <span key={j} className="font-mono text-xs px-2 py-1 rounded-sm"
                        style={{ backgroundColor: `${ts.hex}10`, border: `1px solid ${ts.hex}33`, color: ts.hex }}>
                    {v}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mb-2">Recommended Controls</div>
              <p className="text-xs text-neutral-400 leading-relaxed">{target.protection}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Recommendation swimlane (DEF mode) ─────────────────────── */
function RecSwimlane({ recommendations }) {
  const lanes = [
    { label: 'Immediate',  color: '#ef4444', test: p => p === 1 },
    { label: 'Short-term', color: '#f97316', test: p => p === 2 },
    { label: 'Planned',    color: '#eab308', test: p => p === 3 },
    { label: 'Strategic',  color: '#22c55e', test: p => p >= 4  },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {lanes.map(({ label, color, test }) => {
        const recs = recommendations.filter(r => test(r.priority))
        return (
          <div key={label}>
            {/* Lane header */}
            <div className="flex items-center gap-2 mb-3 pb-2"
                 style={{ borderBottom: `1px solid ${color}33` }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold" style={{ color }}>{label}</span>
              <span className="font-mono text-xs text-neutral-700 ml-auto">{recs.length}</span>
            </div>
            {/* Rec cards */}
            <div className="space-y-2">
              {recs.length === 0 ? (
                <div className="font-mono text-xs text-neutral-800 py-2">-</div>
              ) : recs.map((rec, i) => (
                <div key={i} className="p-3 rounded-sm"
                     style={{ border: `1px solid ${color}22`, backgroundColor: `${color}06` }}>
                  <div className="font-bold text-xs leading-snug mb-1.5 text-neutral-200">{rec.title}</div>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-2">{rec.description}</p>
                  <div className="font-mono text-xs" style={{ color: 'rgb(var(--color-accent2))' }}>
                    {rec.mitre_mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Main dashboard ────────────────────────────────────────── */
/* -- Comparison insight tile -------------------------------------------- */
function ComparisonTile({ comparison, isOpen, onToggle, mode }) {
  const delta = comparison.score_delta
  const improved = delta <= 0
  const accentColor = mode === 'attack' ? 'text-red-400' : 'text-blue-400'
  const accentBorder = mode === 'attack' ? 'border-red-500/20' : 'border-blue-500/20'
  const accentBg = mode === 'attack' ? 'bg-red-500/5' : 'bg-blue-500/5'

  return (
    <div className={`md:col-span-12 serai-card border ${accentBorder} ${accentBg} overflow-hidden fade-in-up`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`font-mono text-xs uppercase tracking-widest ${accentColor}`}>
            Changes Since Last Assessment
          </div>
          <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${improved ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {improved ? '' : '+'}{delta} pts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-neutral-600">{comparison.period}</span>
          <svg
            className={`w-4 h-4 text-neutral-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
          <p className="text-sm text-neutral-400 leading-relaxed">{comparison.summary}</p>

          <div className="grid grid-cols-2 gap-3">
            {comparison.top_improvements.length > 0 && (
              <div>
                <div className="font-mono text-xs text-green-400 uppercase tracking-wider mb-2">What Improved</div>
                <ul className="space-y-1.5">
                  {comparison.top_improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                      <span className="text-green-400 mt-0.5 shrink-0">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comparison.remaining_risks.length > 0 && (
              <div>
                <div className="font-mono text-xs text-amber-400 uppercase tracking-wider mb-2">Still At Risk</div>
                <ul className="space-y-1.5">
                  {comparison.remaining_risks.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                      <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {comparison.outlook && (
            <div className={`rounded-lg border ${accentBorder} ${accentBg} px-3 py-2`}>
              <span className={`font-mono text-xs ${accentColor} uppercase tracking-wider`}>Outlook: </span>
              <span className="text-xs text-neutral-400">{comparison.outlook}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ analysis, onNewAnalysis }) {
  const { id, timestamp, company_name, result } = analysis
  const { toast } = useToast()
  const [mode, setMode] = useState('attack')
  const [comparison, setComparison] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonOpen, setComparisonOpen] = useState(true)

  useEffect(() => {
    if (!id) return
    setComparisonLoading(true)
    const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
    fetch(`${base}/api/analyses/${id}/comparison`)
      .then(r => {
        if (r.status === 204 || r.status === 404) return null
        return r.json()
      })
      .then(data => { setComparison(data); setComparisonLoading(false) })
      .catch(() => setComparisonLoading(false))
  }, [id])

  const riskStyle     = RISK_COLORS[result.risk_level] || RISK_COLORS.MEDIUM
  const formattedDate = (() => { try { return new Date(timestamp).toLocaleString() } catch { return timestamp } })()
  const keyFinding    = extractKeyFinding(result.executive_summary)
  const weakest       = weakestDimension(result.dimension_scores)
  const restOfSummary = keyFinding
    ? result.executive_summary.slice(keyFinding.length).trimStart()
    : result.executive_summary
  const isAtk = mode === 'attack'

  function downloadPdf() {
    window.open(`/api/analyses/${id}/report`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Demo banner ── */}
      {analysis._isDemo && (
        <div className="mb-5 px-4 py-2.5 border flex items-center gap-3 fade-in-up"
             style={{ borderColor: 'rgba(234,179,8,0.25)', backgroundColor: 'rgba(234,179,8,0.04)' }}>
          <span className="font-mono text-xs font-bold text-yellow-400 shrink-0 uppercase tracking-widest">Demo</span>
          <div className="w-px h-3 bg-yellow-500/30 shrink-0" />
          <span className="text-xs text-yellow-400/60">Simulated data - no real analysis was performed</span>
        </div>
      )}

      {/* ── Briefing Header ── */}
      <div className="mb-5 fade-in-up">
        <div className="flex items-center gap-3 mb-2 font-mono text-xs text-neutral-600">
          <span className="uppercase tracking-widest" style={{ color: 'rgb(var(--color-accent) / 0.6)' }}>
            // Threat Assessment
          </span>
          <span>·</span>
          <span>{formattedDate}</span>
          <span>·</span>
          <span className="hidden sm:inline">ID {id.slice(0, 8).toUpperCase()}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{company_name}</h1>
            <div className={`shrink-0 font-mono font-bold text-xs tracking-widest px-3 py-1.5 border ${riskStyle.border} ${riskStyle.bg} ${riskStyle.text}`}
                 style={{ boxShadow: `0 0 16px ${riskStyle.hex}22` }}>
              {result.risk_level}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* ── ATK / DEF mode toggle ── */}
            <div className="flex rounded-sm overflow-hidden"
                 style={{ border: '1px solid rgb(var(--color-border) / 0.6)' }}>
              <button
                onClick={() => setMode('attack')}
                className="font-mono text-xs px-4 py-1.5 uppercase tracking-widest transition-all duration-200"
                style={{
                  backgroundColor: isAtk ? `${riskStyle.hex}20` : 'transparent',
                  color: isAtk ? riskStyle.hex : 'rgb(82 82 82)',
                  borderRight: '1px solid rgb(var(--color-border) / 0.4)',
                }}
              >
                // ATK
              </button>
              <button
                onClick={() => setMode('defense')}
                className="font-mono text-xs px-4 py-1.5 uppercase tracking-widest transition-all duration-200"
                style={{
                  backgroundColor: !isAtk ? '#22c55e20' : 'transparent',
                  color: !isAtk ? '#22c55e' : 'rgb(82 82 82)',
                }}
              >
                // DEF
              </button>
            </div>

            <button onClick={onNewAnalysis} className="serai-btn-secondary text-xs">← New</button>
            <button onClick={downloadPdf} className="serai-btn-primary text-xs">↓ PDF Report</button>
          </div>
        </div>

        <div className="mt-3 h-px"
             style={{ background: `linear-gradient(to right, ${isAtk ? riskStyle.hex : '#22c55e'}44, rgb(var(--color-border) / 0.4), transparent)` }} />
      </div>

      {/* ══════════════════════════════════════════════
          BENTO TILE GRID
      ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* ── Comparison insight tile (shown only when prior analysis exists) ── */}
        {comparisonLoading && (
          <div className="md:col-span-12 serai-card p-4 flex items-center gap-3 fade-in-up">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="font-mono text-xs text-neutral-600">Loading comparison insight...</span>
          </div>
        )}
        {comparison && !comparisonLoading && (
          <ComparisonTile
            comparison={comparison}
            isOpen={comparisonOpen}
            onToggle={() => setComparisonOpen(o => !o)}
            mode={mode}
          />
        )}

        {/* ── Tile 1: Score ring + dimension bars ── */}
        <div className="md:col-span-4 serai-card p-5 fade-in-up"
             style={{ animationDelay: '0.05s', borderLeftWidth: 3, borderLeftColor: isAtk ? riskStyle.hex : '#22c55e' }}>
          <TileHeader label="Global Risk Score" prefix="// 01" />

          <ScoreRing score={result.global_score} riskColor={isAtk ? riskStyle.hex : '#22c55e'} />

          <div className="my-4 px-3 py-2.5 rounded-sm"
               style={{
                 backgroundColor: `${isAtk ? riskStyle.hex : '#22c55e'}0d`,
                 border: `1px solid ${isAtk ? riskStyle.hex : '#22c55e'}2a`,
               }}>
            <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mb-0.5">
              {isAtk ? 'Highest Exposure' : 'Priority to Harden'}
            </div>
            <div className="font-bold text-sm" style={{ color: isAtk ? riskStyle.hex : '#22c55e' }}>
              {weakest.label} - {weakest.score}/100
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              ['People',            result.dimension_scores.people,            '0.3s'],
              ['Technology',        result.dimension_scores.technology,        '0.4s'],
              ['Processes',         result.dimension_scores.processes,         '0.5s'],
              ['Digital Footprint', result.dimension_scores.digital_footprint, '0.6s'],
            ].map(([label, val, d]) => (
              <AnimatedBar key={label} label={label} value={val} delay={d} />
            ))}
          </div>
        </div>

        {/* ── Tile 2: Key finding + executive summary ── */}
        <div className="md:col-span-5 serai-card p-5 flex flex-col fade-in-up"
             style={{ animationDelay: '0.08s' }}>
          <TileHeader
            label={isAtk ? 'Threat Overview' : 'Defensive Posture'}
            prefix="// 02"
          />

          {keyFinding && (
            <div className="mb-4 px-4 py-3"
                 style={{ borderLeft: `3px solid ${isAtk ? riskStyle.hex : '#22c55e'}`, backgroundColor: `${isAtk ? riskStyle.hex : '#22c55e'}08` }}>
              <div className="font-mono text-xs text-neutral-600 uppercase tracking-wider mb-1.5">
                {isAtk ? 'Key Finding' : 'Primary Objective'}
              </div>
              <p className="text-sm font-semibold leading-relaxed"
                 style={{ color: (isAtk ? riskStyle.hex : '#22c55e') + 'cc' }}>
                {keyFinding}
              </p>
            </div>
          )}

          <p className="text-neutral-400 leading-relaxed text-sm flex-1">{restOfSummary}</p>

          <div className="flex flex-wrap gap-2 pt-4 mt-4"
               style={{ borderTop: '1px solid rgb(var(--color-border) / 0.4)' }}>
            {[
              { label: 'Score',     val: `${result.global_score}/100`,                        color: isAtk ? riskStyle.hex : '#22c55e' },
              { label: 'Risk',      val: result.risk_level,                                    color: isAtk ? riskStyle.hex : '#22c55e' },
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
        </div>

        {/* ── Tile 3: Radar chart ── */}
        <div className="md:col-span-3 serai-card p-5 flex flex-col fade-in-up"
             style={{ animationDelay: '0.10s' }}>
          <TileHeader label="Dimension Radar" prefix="// 03" />
          <div className="flex-1 flex items-center justify-center">
            <RadarChart scores={result.dimension_scores} />
          </div>
        </div>

        {/* ── Tile 4: Priority Targets ── */}
        <div className="md:col-span-12 serai-card p-5 fade-in-up"
             style={{ animationDelay: '0.14s' }}>
          <TileHeader
            label={isAtk ? 'High-Value Targets' : 'Assets to Protect'}
            prefix="// 04"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.priority_targets.map((target, i) => (
              <TargetCard
                key={i}
                target={target}
                index={i}
                delay={`${0.16 + i * 0.05}s`}
                mode={mode}
              />
            ))}
          </div>
        </div>

        {/* ══ ATK MODE: Scenarios (7) + Recs compact (5) ══ */}
        {isAtk && (
          <>
            {/* ── Tile 5-ATK: Attack Scenarios ── */}
            <div className="md:col-span-7 serai-card p-5 fade-in-up"
                 style={{ animationDelay: '0.20s' }}>
              <TileHeader label="Attack Scenarios" prefix="// 05" />
              <div className="space-y-3">
                {result.attack_scenarios.map((s, i) => (
                  <div key={i} className="p-4 rounded-sm fade-in-up"
                       style={{
                         animationDelay: `${0.22 + i * 0.05}s`,
                         border: '1px solid rgb(var(--color-border) / 0.4)',
                         backgroundColor: 'rgba(255,255,255,0.015)',
                       }}>
                    <div className="flex items-start gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm mb-1.5 leading-snug">{s.title}</div>
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
                      <ThreatMatrix likelihood={s.likelihood} impact={s.impact} />
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-2.5">{s.description}</p>
                    <div className="flex gap-3">
                      {[{ label: 'Likelihood', val: s.likelihood }, { label: 'Impact', val: s.impact }].map(({ label, val }) => {
                        const c = val === 'HIGH' ? '#ef4444' : val === 'MEDIUM' ? '#eab308' : '#22c55e'
                        return (
                          <div key={label} className="flex items-center gap-1.5 font-mono text-xs" style={{ color: c }}>
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
            </div>

            {/* ── Tile 6-ATK: Recommendations (compact) ── */}
            <div className="md:col-span-5 serai-card p-5 fade-in-up"
                 style={{ animationDelay: '0.22s' }}>
              <TileHeader label="Recommendations" prefix="// 06" />
              <div className="space-y-2.5">
                {result.recommendations.map((rec, i) => {
                  const tf = recTimeframe(rec.priority)
                  return (
                    <div key={i} className="rounded-sm overflow-hidden fade-in-up"
                         style={{ animationDelay: `${0.24 + i * 0.05}s`, border: '1px solid rgb(var(--color-border) / 0.4)' }}>
                      <div className="h-0.5 w-full" style={{ backgroundColor: `${tf.color}22` }}>
                        <div className="h-full" style={{ width: `${Math.max(20, 100 - (rec.priority - 1) * 18)}%`, backgroundColor: tf.color }} />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="font-bold text-sm leading-snug">{rec.title}</div>
                          <div className="shrink-0 font-mono text-xs px-2 py-0.5 rounded-sm"
                               style={{ backgroundColor: `${tf.color}15`, border: `1px solid ${tf.color}33`, color: tf.color }}>
                            {tf.label}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed mb-2">{rec.description}</p>
                        <div className="font-mono text-xs" style={{ color: 'rgb(var(--color-accent2))' }}>{rec.mitre_mitigation}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ══ DEF MODE: Recs swimlane (12) + Scenarios compact (12) ══ */}
        {!isAtk && (
          <>
            {/* ── Tile 5-DEF: Recommendations swimlane ── */}
            <div className="md:col-span-12 serai-card p-5 fade-in-up"
                 style={{ animationDelay: '0.20s' }}>
              <TileHeader label="Remediation Roadmap" prefix="// 05" />
              <RecSwimlane recommendations={result.recommendations} />
            </div>

            {/* ── Tile 6-DEF: Scenarios compact ── */}
            <div className="md:col-span-12 serai-card p-5 fade-in-up"
                 style={{ animationDelay: '0.24s' }}>
              <TileHeader label="Threat Vectors to Monitor" prefix="// 06" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.attack_scenarios.map((s, i) => (
                  <div key={i} className="p-4 rounded-sm fade-in-up"
                       style={{
                         animationDelay: `${0.26 + i * 0.04}s`,
                         border: '1px solid rgb(var(--color-border) / 0.4)',
                         backgroundColor: 'rgba(255,255,255,0.015)',
                       }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-bold text-sm leading-snug flex-1">{s.title}</div>
                      <ThreatMatrix likelihood={s.likelihood} impact={s.impact} />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
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
                    <div className="flex gap-3">
                      {[{ label: 'Likelihood', val: s.likelihood }, { label: 'Impact', val: s.impact }].map(({ label, val }) => {
                        const c = val === 'HIGH' ? '#ef4444' : val === 'MEDIUM' ? '#eab308' : '#22c55e'
                        return (
                          <div key={label} className="flex items-center gap-1.5 font-mono text-xs" style={{ color: c }}>
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
            </div>
          </>
        )}

      </div>{/* end bento grid */}

      {/* ── Floating mode pill (portal to escape parent transforms) ── */}
      {createPortal(
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          borderRadius: '2px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(10,10,10,0.85)',
          boxShadow: `0 0 20px ${isAtk ? riskStyle.hex : '#22c55e'}25, 0 4px 20px rgba(0,0,0,0.6)`,
          transition: 'box-shadow 0.3s ease',
        }}>
          <button
            onClick={() => setMode('attack')}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.7rem',
              padding: '0.5rem 1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
              backgroundColor: isAtk ? `${riskStyle.hex}22` : 'transparent',
              color: isAtk ? riskStyle.hex : 'rgb(82,82,82)',
            }}
          >
            // ATK
          </button>
          <button
            onClick={() => setMode('defense')}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.7rem',
              padding: '0.5rem 1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
              backgroundColor: !isAtk ? '#22c55e22' : 'transparent',
              color: !isAtk ? '#22c55e' : 'rgb(82,82,82)',
            }}
          >
            // DEF
          </button>
        </div>,
        document.body
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between font-mono text-xs text-neutral-700 py-4 mt-4 fade-in-up"
           style={{ animationDelay: '0.4s', borderTop: '1px solid rgb(var(--color-border) / 0.3)' }}>
        <span>Analysis ID: <span className="text-neutral-600">{id}</span></span>
        <span>Generated locally · No data transmitted externally</span>
      </div>
    </div>
  )
}
