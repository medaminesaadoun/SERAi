import { useState, useEffect } from 'react'
import axios from 'axios'

const RISK_COLORS = {
  LOW: 'text-green-400 border-green-500/30 bg-green-500/5',
  MEDIUM: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  HIGH: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  CRITICAL: 'text-red-400 border-red-500/30 bg-red-500/5',
}

export default function AnalysisHistory({ onSelect }) {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('/api/analyses')
      .then(r => { setAnalyses(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  async function loadAnalysis(id) {
    try {
      const res = await axios.get(`/api/analyses/${id}`)
      onSelect(res.data)
    } catch (e) {
      alert('Failed to load analysis: ' + e.message)
    }
  }

  if (loading) return (
    <div className="text-center py-20 font-mono text-neutral-600">
      Loading history…
    </div>
  )

  if (error) return (
    <div className="text-center py-20 font-mono text-red-400">
      Error: {error}
    </div>
  )

  if (analyses.length === 0) return (
    <div className="text-center py-20">
      <div className="font-mono text-neutral-600 mb-2">No analyses yet</div>
      <div className="text-sm text-neutral-700">Run your first analysis to see it here.</div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Past Analyses</div>
        <h1 className="text-xl font-bold">Analysis History</h1>
      </div>

      <div className="space-y-3">
        {analyses.map(a => {
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
                <span className="text-neutral-600 group-hover:text-accent transition-colors">→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
