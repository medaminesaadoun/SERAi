import { useState } from 'react'
import RadarChart from './RadarChart'

const RISK_COLORS = {
  LOW: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', hex: '#22c55e' },
  MEDIUM: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', hex: '#eab308' },
  HIGH: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', hex: '#f97316' },
  CRITICAL: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', hex: '#ef4444' },
}

const TARGET_COLORS = {
  MAX: RISK_COLORS.CRITICAL,
  HIGH: RISK_COLORS.HIGH,
  MEDIUM: RISK_COLORS.MEDIUM,
  LOW: RISK_COLORS.LOW,
}

function ScoreBar({ label, value }) {
  const color = value >= 75 ? '#ef4444' : value >= 50 ? '#f97316' : value >= 25 ? '#eab308' : '#22c55e'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-neutral-400">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  )
}

function Section({ title, prefix, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <span className="font-mono text-xs text-accent">{prefix}</span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Dashboard({ analysis, onNewAnalysis }) {
  const { id, timestamp, company_name, result } = analysis
  const [downloading, setDownloading] = useState(false)

  const riskStyle = RISK_COLORS[result.risk_level] || RISK_COLORS.MEDIUM

  async function downloadPdf() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/analyses/${id}/pdf`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SERAi-report-${company_name.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('PDF generation failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  const formattedDate = (() => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch { return timestamp }
  })()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">
            // Analysis Complete
          </div>
          <h1 className="text-2xl font-bold">{company_name}</h1>
          <div className="text-neutral-500 text-sm font-mono mt-1">{formattedDate}</div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={onNewAnalysis} className="serai-btn-secondary">
            ← New Analysis
          </button>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="serai-btn-primary flex items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Generating…
              </>
            ) : '↓ PDF Report'}
          </button>
        </div>
      </div>

      {/* Global score + radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Score */}
        <div className={`serai-card p-6 border-l-4`} style={{ borderLeftColor: riskStyle.hex }}>
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">
            Global Risk Score
          </div>
          <div
            className="font-mono text-8xl font-black leading-none glow-score"
            style={{ color: riskStyle.hex }}
          >
            {result.global_score}
          </div>
          <div className="text-neutral-600 font-mono text-sm mb-4">/ 100</div>
          <div className={`inline-block border ${riskStyle.border} ${riskStyle.bg} ${riskStyle.text}
                          font-mono font-bold tracking-widest px-4 py-1 text-sm`}>
            {result.risk_level}
          </div>

          <div className="mt-6 space-y-3">
            <ScoreBar label="People" value={result.dimension_scores.people} />
            <ScoreBar label="Technology" value={result.dimension_scores.technology} />
            <ScoreBar label="Processes" value={result.dimension_scores.processes} />
            <ScoreBar label="Digital Footprint" value={result.dimension_scores.digital_footprint} />
          </div>
        </div>

        {/* Radar */}
        <div className="serai-card p-6 flex flex-col items-center justify-center">
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
            Dimension Radar
          </div>
          <RadarChart scores={result.dimension_scores} />
        </div>
      </div>

      {/* Executive Summary */}
      <Section title="Executive Summary" prefix="// 01">
        <div className="serai-card p-5 text-neutral-300 leading-relaxed border-l-2 border-accent">
          {result.executive_summary}
        </div>
      </Section>

      {/* Priority Targets */}
      <Section title="Priority Targets" prefix="// 02">
        <div className="grid gap-4">
          {result.priority_targets.map((target, i) => {
            const ts = TARGET_COLORS[target.risk_level] || TARGET_COLORS.MEDIUM
            return (
              <div
                key={i}
                className={`serai-card p-5 border-l-4`}
                style={{ borderLeftColor: ts.hex }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-bold text-base">{target.name}</div>
                    <div className="text-neutral-500 text-sm">{target.role}</div>
                  </div>
                  <span className={`badge badge-${target.risk_level.toLowerCase()}`}>
                    {target.risk_level}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {target.attack_vectors.map((v, j) => (
                    <span
                      key={j}
                      className="font-mono text-xs bg-accent/5 border border-accent/20 text-accent px-2 py-0.5"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-neutral-500">
                  <span className="text-neutral-300 font-semibold">Protection: </span>
                  {target.protection}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Attack Scenarios */}
      <Section title="Attack Scenarios" prefix="// 03">
        <div className="grid gap-4">
          {result.attack_scenarios.map((s, i) => {
            const likelColor = s.likelihood === 'HIGH' ? '#ef4444' : s.likelihood === 'MEDIUM' ? '#eab308' : '#22c55e'
            const impactColor = s.impact === 'HIGH' ? '#ef4444' : s.impact === 'MEDIUM' ? '#eab308' : '#22c55e'
            return (
              <div key={i} className="serai-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-base mb-1">{s.title}</div>
                    <span className="font-mono text-xs bg-neutral-800 text-neutral-400 border border-border px-2 py-0.5 uppercase">
                      {s.type}
                    </span>
                  </div>
                  <span className="font-mono text-xs bg-accent/5 border border-accent/20 text-accent px-3 py-1 whitespace-nowrap">
                    {s.mitre_technique}
                  </span>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed mb-3">{s.description}</p>
                <div className="flex gap-4 text-xs font-mono">
                  <span>
                    Likelihood: <span style={{ color: likelColor }}>{s.likelihood}</span>
                  </span>
                  <span>
                    Impact: <span style={{ color: impactColor }}>{s.impact}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Recommendations */}
      <Section title="Recommendations" prefix="// 04">
        <div className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="serai-card p-5 flex gap-5 border-l-2 border-accent">
              <div className="font-mono font-black text-2xl text-accent leading-none min-w-[3rem]">
                {String(rec.priority).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="font-bold text-base mb-1">{rec.title}</div>
                <div className="text-sm text-neutral-500 mb-2">{rec.description}</div>
                <div className="font-mono text-xs text-accent2">MITRE: {rec.mitre_mitigation}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer note */}
      <div className="serai-card p-4 text-xs text-neutral-600 text-center font-mono">
        Analysis ID: {id} · Generated locally · No data transmitted externally
      </div>
    </div>
  )
}
