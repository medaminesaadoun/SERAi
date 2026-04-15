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
  const radius       = 52
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset]       = useState(circumference)
  const [display, setDisplay]     = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    // Small delay so the card has rendered and CSS transition fires
    const t = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference)

      // Count-up animation
      const duration = 1400
      const start = performance.now()
      function tick(now) {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)   // ease-out cubic
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
        {/* Track */}
        <circle cx="60" cy="60" r={radius} fill="none"
                stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        {/* Glow copy (blurred) */}
        <circle cx="60" cy="60" r={radius} fill="none"
                stroke={riskColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{
                  transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)',
                  filter: `blur(6px) drop-shadow(0 0 10px ${riskColor})`,
                  opacity: 0.4,
                }}/>
        {/* Solid ring */}
        <circle cx="60" cy="60" r={radius} fill="none"
                stroke={riskColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}/>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono font-black text-5xl leading-none" style={{ color: riskColor }}>
          {display}
        </div>
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
        <span className="font-mono font-bold" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full animated-bar"
          style={{ '--bar-w': `${value}%`, '--bar-delay': delay, background: color }}
        />
      </div>
    </div>
  )
}

/* ── Section wrapper ───────────────────────────────────────── */
function Section({ title, prefix, children, delay = '0s' }) {
  return (
    <div className="mb-8 fade-in-up" style={{ animationDelay: delay }}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/60">
        <span className="font-mono text-xs text-accent">{prefix}</span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

/* ── Main dashboard ────────────────────────────────────────── */
export default function Dashboard({ analysis, onNewAnalysis }) {
  const { id, timestamp, company_name, result } = analysis
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  const riskStyle  = RISK_COLORS[result.risk_level] || RISK_COLORS.MEDIUM
  const formattedDate = (() => { try { return new Date(timestamp).toLocaleString() } catch { return timestamp } })()

  async function downloadPdf() {
    setDownloading(true)
    try {
      toast.info('Generating PDF report…', 3000)
      const res = await fetch(`/api/analyses/${id}/pdf`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `SERAi-report-${company_name.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully!')
    } catch (e) {
      toast.error('PDF generation failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Demo banner ── */}
      {analysis._isDemo && (
        <div className="mb-6 px-4 py-3 rounded-sm border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3 fade-in-up">
          <span className="font-mono text-xs font-bold text-yellow-400 shrink-0 uppercase tracking-widest">Demo</span>
          <span className="text-xs text-yellow-400/70">
            This is simulated data for demonstration purposes — no real analysis was performed.
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 fade-in-up">
        <div className="min-w-0">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Analysis Complete</div>
          <h1 className="text-xl sm:text-2xl font-bold truncate">{company_name}</h1>
          <div className="text-neutral-600 text-xs font-mono mt-1">{formattedDate}</div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={onNewAnalysis} className="serai-btn-secondary text-xs sm:text-sm">← New</button>
          <button onClick={downloadPdf} disabled={downloading} className="serai-btn-primary flex items-center gap-2 text-xs sm:text-sm">
            {downloading
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Generating…</>
              : '↓ PDF Report'}
          </button>
        </div>
      </div>

      {/* ── Score + Radar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Score card */}
        <div className="serai-card p-6 fade-in-up" style={{ animationDelay: '0.05s', borderLeftWidth: 3, borderLeftColor: riskStyle.hex }}>
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">Global Risk Score</div>
          <ScoreRing score={result.global_score} riskColor={riskStyle.hex} />
          <div className="flex justify-center mt-4 mb-6">
            <div className={`border ${riskStyle.border} ${riskStyle.bg} ${riskStyle.text}
                             font-mono font-bold tracking-widest px-5 py-1.5 text-sm rounded-sm`}
                 style={{ boxShadow: `0 0 20px ${riskStyle.hex}33` }}>
              {result.risk_level}
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['People',           result.dimension_scores.people,           '0.3s'],
              ['Technology',       result.dimension_scores.technology,       '0.4s'],
              ['Processes',        result.dimension_scores.processes,        '0.5s'],
              ['Digital Footprint',result.dimension_scores.digital_footprint,'0.6s'],
            ].map(([label, val, d]) => (
              <AnimatedBar key={label} label={label} value={val} delay={d} />
            ))}
          </div>
        </div>

        {/* Radar card */}
        <div className="serai-card p-6 flex flex-col items-center justify-center fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">Dimension Radar</div>
          <RadarChart scores={result.dimension_scores} />
        </div>
      </div>

      {/* ── Executive Summary ── */}
      <Section title="Executive Summary" prefix="// 01" delay="0.15s">
        <div className="serai-card p-5 text-neutral-300 leading-relaxed"
             style={{ borderLeftWidth: 3, borderLeftColor: riskStyle.hex }}>
          {result.executive_summary}
        </div>
      </Section>

      {/* ── Priority Targets ── */}
      <Section title="Priority Targets" prefix="// 02" delay="0.2s">
        <div className="space-y-3">
          {result.priority_targets.map((target, i) => {
            const ts = TARGET_COLORS[target.risk_level] || TARGET_COLORS.MEDIUM
            return (
              <div key={i} className="serai-card p-5 fade-in-up"
                   style={{ animationDelay: `${0.2 + i * 0.07}s`, borderLeftWidth: 3, borderLeftColor: ts.hex }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-bold text-base">{target.name}</div>
                    <div className="text-neutral-500 text-sm">{target.role}</div>
                  </div>
                  <span className={`badge badge-${target.risk_level.toLowerCase()}`}>{target.risk_level}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {target.attack_vectors.map((v, j) => (
                    <span key={j} className="font-mono text-xs bg-accent/5 border border-accent/20 text-accent px-2 py-0.5 rounded-sm">
                      {v}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-neutral-500">
                  <span className="text-neutral-300 font-semibold">Protection: </span>{target.protection}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Attack Scenarios ── */}
      <Section title="Attack Scenarios" prefix="// 03" delay="0.25s">
        <div className="grid gap-3">
          {result.attack_scenarios.map((s, i) => {
            const likelColor  = s.likelihood === 'HIGH' ? '#ef4444' : s.likelihood === 'MEDIUM' ? '#eab308' : '#22c55e'
            const impactColor = s.impact     === 'HIGH' ? '#ef4444' : s.impact     === 'MEDIUM' ? '#eab308' : '#22c55e'
            return (
              <div key={i} className="serai-card p-5 fade-in-up" style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-base mb-1.5">{s.title}</div>
                    <span className="font-mono text-xs bg-white/5 text-neutral-400 border border-border/50 px-2 py-0.5 uppercase rounded-sm">
                      {s.type}
                    </span>
                  </div>
                  <span className="font-mono text-xs bg-accent/5 border border-accent/20 text-accent px-3 py-1 whitespace-nowrap rounded-sm">
                    {s.mitre_technique}
                  </span>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed mb-3">{s.description}</p>
                <div className="flex gap-5 text-xs font-mono">
                  <span>Likelihood: <span style={{ color: likelColor }}>{s.likelihood}</span></span>
                  <span>Impact: <span style={{ color: impactColor }}>{s.impact}</span></span>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Recommendations ── */}
      <Section title="Recommendations" prefix="// 04" delay="0.3s">
        <div className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="serai-card p-5 flex gap-5 fade-in-up"
                 style={{ animationDelay: `${0.3 + i * 0.06}s`, borderLeftWidth: 2, borderLeftColor: 'rgb(var(--color-accent))' }}>
              <div className="font-mono font-black text-2xl text-accent leading-none min-w-[3rem] pt-0.5">
                {String(rec.priority).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="font-bold text-base mb-1">{rec.title}</div>
                <div className="text-sm text-neutral-500 mb-2">{rec.description}</div>
                <div className="font-mono text-xs" style={{ color: 'rgb(var(--color-accent2))' }}>
                  MITRE: {rec.mitre_mitigation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer note */}
      <div className="serai-card p-3 text-xs text-neutral-700 text-center font-mono fade-in-up" style={{ animationDelay: '0.4s' }}>
        Analysis ID: {id} · Generated locally · No data transmitted externally
      </div>
    </div>
  )
}
