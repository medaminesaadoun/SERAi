import { useState, useEffect } from 'react'
import axios from 'axios'
import FormStepper from './components/FormStepper'
import Dashboard from './components/Dashboard'
import AnalysisHistory from './components/AnalysisHistory'

const API = '/api'

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-2xl font-bold tracking-tight">
        <span className="text-accent">SER</span>
        <span className="text-white">A</span>
        {/* The "i" with crosshair dot */}
        <span className="relative inline-flex items-start">
          <span className="text-white">i</span>
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent
                       ring-2 ring-bg border-2 border-accent"
            style={{ boxShadow: '0 0 6px rgba(163,230,53,0.8)' }}
          />
        </span>
      </span>
      <span className="hidden sm:block text-neutral-600 font-mono text-xs tracking-widest uppercase">
        Social Engineering Risk Analyzer
      </span>
    </div>
  )
}

function StatusPill({ health }) {
  if (!health) return null
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span
        className={`w-1.5 h-1.5 rounded-full ${health.ollama_connected ? 'bg-accent' : 'bg-red-500'} animate-pulse`}
      />
      <span className={health.ollama_connected ? 'text-accent' : 'text-red-400'}>
        {health.ollama_connected ? `Ollama · ${health.model}` : 'Ollama offline'}
      </span>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('form') // 'form' | 'result' | 'history'
  const [analysis, setAnalysis] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    axios.get(`${API}/health`)
      .then(r => setHealth(r.data))
      .catch(() => setHealth({ ollama_connected: false, model: 'unknown', message: '' }))
  }, [])

  function handleAnalysisDone(data) {
    setAnalysis(data)
    setView('result')
  }

  function handleSelectHistory(data) {
    setAnalysis(data)
    setView('result')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-bg/95 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-4">
          <StatusPill health={health} />
          <nav className="flex gap-1">
            {[['form', 'New Analysis'], ['history', 'History']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 transition-colors ${
                  view === v
                    ? 'text-accent border-b border-accent'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        {view === 'form' && (
          <FormStepper onComplete={handleAnalysisDone} />
        )}
        {view === 'result' && analysis && (
          <Dashboard
            analysis={analysis}
            onNewAnalysis={() => setView('form')}
          />
        )}
        {view === 'history' && (
          <AnalysisHistory onSelect={handleSelectHistory} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 flex items-center justify-between text-neutral-700 font-mono text-xs">
        <span>SERAi v1.0 — Local-only · No data leaves your machine</span>
        <span>For authorized security assessments only</span>
      </footer>
    </div>
  )
}
