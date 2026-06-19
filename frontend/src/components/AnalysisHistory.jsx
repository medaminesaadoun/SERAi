import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  RadialLinearScale, Filler, Tooltip, Legend
} from 'chart.js'
import { Line, Radar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend)

const RISK_COLORS = {
  LOW: 'text-green-400 border-green-500/30 bg-green-500/5',
  MEDIUM: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  HIGH: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  CRITICAL: 'text-red-400 border-red-500/30 bg-red-500/5',
}

const DIM_COLORS = {
  overall:          { line: '#a3e635', fill: 'rgba(163,230,53,0.08)' },
  people:           { line: '#f87171', fill: 'rgba(248,113,113,0.08)' },
  technology:       { line: '#60a5fa', fill: 'rgba(96,165,250,0.08)' },
  processes:        { line: '#fbbf24', fill: 'rgba(251,191,36,0.08)' },
  digital_footprint:{ line: '#c084fc', fill: 'rgba(192,132,252,0.08)' },
}

function TrendChart({ analyses }) {
  const sorted = [...analyses].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const labels = sorted.map(a => new Date(a.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))

  const datasets = [
    {
      label: 'Overall',
      data: sorted.map(a => a.global_score),
      borderColor: DIM_COLORS.overall.line,
      backgroundColor: DIM_COLORS.overall.fill,
      borderWidth: 2, pointRadius: 5, pointHoverRadius: 7, tension: 0.3, fill: false,
    },
    {
      label: 'People',
      data: sorted.map(a => a.dimension_scores?.people ?? null),
      borderColor: DIM_COLORS.people.line,
      backgroundColor: DIM_COLORS.people.fill,
      borderWidth: 1.5, pointRadius: 3, tension: 0.3, fill: false, borderDash: [4,2],
    },
    {
      label: 'Technology',
      data: sorted.map(a => a.dimension_scores?.technology ?? null),
      borderColor: DIM_COLORS.technology.line,
      backgroundColor: DIM_COLORS.technology.fill,
      borderWidth: 1.5, pointRadius: 3, tension: 0.3, fill: false, borderDash: [4,2],
    },
    {
      label: 'Processes',
      data: sorted.map(a => a.dimension_scores?.processes ?? null),
      borderColor: DIM_COLORS.processes.line,
      backgroundColor: DIM_COLORS.processes.fill,
      borderWidth: 1.5, pointRadius: 3, tension: 0.3, fill: false, borderDash: [4,2],
    },
    {
      label: 'Digital Footprint',
      data: sorted.map(a => a.dimension_scores?.digital_footprint ?? null),
      borderColor: DIM_COLORS.digital_footprint.line,
      backgroundColor: DIM_COLORS.digital_footprint.fill,
      borderWidth: 1.5, pointRadius: 3, tension: 0.3, fill: false, borderDash: [4,2],
    },
  ]

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af', font: { family: 'monospace', size: 11 }, boxWidth: 20 }
      },
      tooltip: {
        backgroundColor: '#111', borderColor: '#333', borderWidth: 1,
        titleColor: '#e5e7eb', bodyColor: '#9ca3af',
        callbacks: {
          title: items => labels[items[0].dataIndex],
          label: item => ` ${item.dataset.label}: ${item.raw}/100`,
        }
      }
    },
    scales: {
      x: { ticks: { color: '#6b7280', font: { family: 'monospace', size: 11 } }, grid: { color: '#1f2937' } },
      y: {
        min: 0, max: 100,
        ticks: { color: '#6b7280', font: { family: 'monospace', size: 11 }, stepSize: 20 },
        grid: { color: '#1f2937' }
      }
    }
  }

  return (
    <div style={{ height: 260 }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  )
}

function RadarComparison({ analyses }) {
  const sorted = [...analyses].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const [idxA, setIdxA] = useState(0)
  const [idxB, setIdxB] = useState(Math.max(sorted.length - 1, 0))

  const labels = ['People', 'Technology', 'Processes', 'Digital Footprint']
  const toData = (a) => [
    a.dimension_scores?.people ?? 0,
    a.dimension_scores?.technology ?? 0,
    a.dimension_scores?.processes ?? 0,
    a.dimension_scores?.digital_footprint ?? 0,
  ]

  const runA = sorted[idxA]
  const runB = sorted[idxB]

  const radarData = {
    labels,
    datasets: [
      {
        label: `${new Date(runA.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} (baseline)`,
        data: toData(runA),
        borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.15)',
        borderWidth: 2, pointRadius: 4,
      },
      {
        label: `${new Date(runB.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} (latest)`,
        data: toData(runB),
        borderColor: '#a3e635', backgroundColor: 'rgba(163,230,53,0.10)',
        borderWidth: 2, pointRadius: 4, borderDash: idxA === idxB ? [4,2] : [],
      },
    ]
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { family: 'monospace', size: 11 }, boxWidth: 16 } }
    },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { stepSize: 25, color: '#6b7280', backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: '#1f2937' },
        pointLabels: { color: '#9ca3af', font: { family: 'monospace', size: 11 } },
        angleLines: { color: '#1f2937' },
      }
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div>
          <div className="font-mono text-xs text-neutral-600 mb-1">Baseline run</div>
          <select
            value={idxA}
            onChange={e => setIdxA(Number(e.target.value))}
            className="serai-input text-sm py-1.5 pr-8"
          >
            {sorted.map((a, i) => (
              <option key={a.id} value={i}>
                {new Date(a.timestamp).toLocaleDateString()} - Score {a.global_score}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1 text-neutral-600 font-mono text-sm">vs</div>
        <div>
          <div className="font-mono text-xs text-neutral-600 mb-1">Comparison run</div>
          <select
            value={idxB}
            onChange={e => setIdxB(Number(e.target.value))}
            className="serai-input text-sm py-1.5 pr-8"
          >
            {sorted.map((a, i) => (
              <option key={a.id} value={i}>
                {new Date(a.timestamp).toLocaleDateString()} - Score {a.global_score}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ height: 280 }}>
        <Radar data={radarData} options={radarOptions} />
      </div>
    </div>
  )
}

export default function AnalysisHistory({ onSelect }) {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [draftViewer, setDraftViewer] = useState(null)  // {draft, loading}

  useEffect(() => {
    const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
    axios.get(`${base}/api/analyses`)
      .then(r => { setAnalyses(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  async function loadAnalysis(id) {
    try {
      const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
      const res = await axios.get(`${base}/api/analyses/${id}`)
      onSelect(res.data)
    } catch (e) {
      alert('Failed to load analysis: ' + e.message)
    }
  }

  async function viewDraft(draftId) {
    setDraftViewer({ draft: null, loading: true })
    try {
      const base = import.meta.env.DEV ? 'http://localhost:8000' : ''
      const res = await axios.get(`${base}/api/drafts/${draftId}`)
      setDraftViewer({ draft: res.data, loading: false })
    } catch (e) {
      setDraftViewer({ draft: null, loading: false, error: e.message })
    }
  }

  if (loading) return <div className="text-center py-20 font-mono text-neutral-600">Loading history...</div>
  if (error) return <div className="text-center py-20 font-mono text-red-400">Error: {error}</div>
  if (analyses.length === 0) return (
    <div className="text-center py-20">
      <div className="font-mono text-neutral-600 mb-2">No analyses yet</div>
      <div className="text-sm text-neutral-700">Run your first analysis to see it here.</div>
    </div>
  )

  const companies = [...new Set(analyses.map(a => a.company_name))].sort()
  const filtered = selectedCompany ? analyses.filter(a => a.company_name === selectedCompany) : analyses
  const showCharts = selectedCompany && filtered.length >= 2

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Past Analyses</div>
          <h1 className="text-xl font-bold">Analysis History</h1>
        </div>
        <div>
          <div className="font-mono text-xs text-neutral-600 mb-1">Filter by company</div>
          <select
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            className="serai-input text-sm py-1.5 pr-8 min-w-48"
          >
            <option value="">All companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {showCharts && (
        <div className="space-y-4 mb-8">
          <div className="serai-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-xs text-accent uppercase tracking-widest mb-0.5">// Risk Score Over Time</div>
                <div className="text-sm text-neutral-400">{selectedCompany}</div>
              </div>
              <span className="font-mono text-xs text-neutral-600">{filtered.length} run{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <TrendChart analyses={filtered} />
          </div>

          <div className="serai-card p-5">
            <div className="mb-4">
              <div className="font-mono text-xs text-accent uppercase tracking-widest mb-0.5">// Compare Two Runs</div>
              <div className="text-xs text-neutral-600">Select any two assessments to overlay their dimension profiles</div>
            </div>
            <RadarComparison analyses={filtered} />
          </div>
        </div>
      )}

      {!showCharts && selectedCompany && filtered.length < 2 && (
        <div className="serai-card p-4 mb-6 text-center text-sm text-neutral-600 font-mono">
          Run at least 2 analyses for {selectedCompany} to see trend charts.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(a => {
          const riskClass = RISK_COLORS[a.risk_level] || RISK_COLORS.MEDIUM
          const date = (() => {
            try { return new Date(a.timestamp).toLocaleString() }
            catch { return a.timestamp }
          })()
          const isCancelled = a.status === 'cancelled'
          const hasDraft = !!a.draft_id
          const handleClick = () => {
            if (isCancelled && hasDraft) {
              viewDraft(a.draft_id)
            } else {
              loadAnalysis(a.id)
            }
          }

          return (
            <button
              key={a.id}
              onClick={handleClick}
              className={`w-full serai-card p-4 flex items-center justify-between gap-4 hover:border-accent/40 transition-colors text-left group ${
                isCancelled ? 'border-yellow-500/20' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-neutral-200 group-hover:text-accent transition-colors truncate">
                    {a.company_name}
                  </div>
                  {isCancelled && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 border border-yellow-500/40 text-yellow-400 bg-yellow-500/5 uppercase tracking-wider shrink-0">
                      Cancelled
                    </span>
                  )}
                  {hasDraft && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 border border-accent/40 text-accent bg-accent/5 uppercase tracking-wider shrink-0">
                      Draft
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-600 font-mono mt-0.5">{date}</div>
                {isCancelled && a.cancelled_at_pct != null && (
                  <div className="text-[10px] text-yellow-400/70 font-mono mt-1">
                    {Math.round(a.cancelled_at_pct * 100)}% complete when cancelled
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!isCancelled ? (
                  <>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xl text-neutral-300">{a.global_score}</div>
                      <div className="font-mono text-xs text-neutral-600">/100</div>
                    </div>
                    <span className={`badge border ${riskClass}`}>{a.risk_level}</span>
                  </>
                ) : (
                  <span className="font-mono text-xs text-yellow-400/70">
                    no score
                  </span>
                )}
                <span className="text-neutral-600 group-hover:text-accent transition-colors">-&gt;</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Draft viewer modal */}
      {draftViewer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in-up"
             onClick={() => setDraftViewer(null)}>
          <div className="relative w-full max-w-3xl bg-bg border border-border rounded-sm shadow-2xl overflow-hidden"
               style={{ backgroundColor: 'var(--bg-hex)' }}
               onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-black/30">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-accent">Draft</div>
                {draftViewer.draft && (
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">
                    {draftViewer.draft.company_name} · {Math.round((draftViewer.draft.progress_pct || 0) * 100)}% complete
                    {draftViewer.draft.expires_at && (
                      <> · expires {new Date(draftViewer.draft.expires_at).toLocaleDateString()}</>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setDraftViewer(null)}
                className="w-7 h-7 flex items-center justify-center border border-border rounded-sm text-neutral-400 hover:text-accent hover:border-accent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              {draftViewer.loading && (
                <div className="text-center py-12 font-mono text-neutral-600">Loading draft...</div>
              )}
              {draftViewer.error && (
                <div className="text-red-400 font-mono text-sm">⚠ {draftViewer.error}</div>
              )}
              {draftViewer.draft && (
                <>
                  {draftViewer.draft.tasks_completed?.length > 0 && (
                    <div className="mb-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                        Steps completed
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {draftViewer.draft.tasks_completed.map(id => (
                          <span key={id} className="font-mono text-[10px] px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-sm">
                            ✓ {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border border-border/60 rounded-sm bg-black/30 max-h-96 overflow-y-auto p-4">
                    <pre className="font-mono text-[11px] text-neutral-400 whitespace-pre-wrap break-words leading-relaxed">
                      {draftViewer.draft.partial_text || '(no streamed text)'}
                    </pre>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => navigator.clipboard?.writeText(draftViewer.draft.partial_text || '').catch(() => {})}
                      className="font-mono text-xs px-3 py-1.5 border border-border text-neutral-300 hover:text-accent hover:border-accent/40 rounded-sm uppercase tracking-widest"
                    >
                      Copy
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
