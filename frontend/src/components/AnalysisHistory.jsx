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
          return (
            <button
              key={a.id}
              onClick={() => loadAnalysis(a.id)}
              className="w-full serai-card p-4 flex items-center justify-between gap-4 hover:border-accent/40 transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-200 group-hover:text-accent transition-colors truncate">
                  {a.company_name}
                </div>
                <div className="text-xs text-neutral-600 font-mono mt-0.5">{date}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-mono font-bold text-xl text-neutral-300">{a.global_score}</div>
                  <div className="font-mono text-xs text-neutral-600">/100</div>
                </div>
                <span className={`badge border ${riskClass}`}>{a.risk_level}</span>
                <span className="text-neutral-600 group-hover:text-accent transition-colors">-&gt;</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
