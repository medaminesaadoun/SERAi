import { useState, useEffect } from 'react'
import axios from 'axios'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ThemeSwitcher from './components/ThemeSwitcher'
import LandingPage from './components/LandingPage'
import FormStepper from './components/FormStepper'
import Dashboard from './components/Dashboard'
import AnalysisHistory from './components/AnalysisHistory'

const API = '/api'

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 group">
      <span className="font-mono text-2xl font-bold tracking-tight select-none">
        <span className="text-accent group-hover:opacity-80 transition-opacity">SER</span>
        <span className="text-white">A</span>
        <span className="relative inline-flex items-start">
          <span className="text-white">i</span>
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent ring-2 ring-bg border-2 border-accent"
            style={{ boxShadow: '0 0 8px rgb(var(--color-accent) / 0.9)' }}
          />
        </span>
      </span>
      <span className="hidden sm:block text-neutral-600 font-mono text-xs tracking-widest uppercase">
        Social Engineering Risk Analyzer
      </span>
    </button>
  )
}

function StatusPill({ health }) {
  if (!health) return null
  return (
    <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${health.ollama_connected ? 'bg-accent' : 'bg-red-500'}`} />
      <span className={health.ollama_connected ? 'text-accent' : 'text-red-400'}>
        {health.ollama_connected ? `Ollama · ${health.model}` : 'Ollama offline'}
      </span>
    </div>
  )
}

function AppInner() {
  const [view, setView]       = useState('home')
  const [analysis, setAnalysis] = useState(null)
  const [health, setHealth]   = useState(null)
  const { theme }             = useTheme()

  useEffect(() => {
    axios.get(`${API}/health`)
      .then(r => setHealth(r.data))
      .catch(() => setHealth({ ollama_connected: false, model: 'unknown' }))
  }, [])

  function handleAnalysisDone(data) { setAnalysis(data); setView('result') }
  function handleSelectHistory(data) { setAnalysis(data); setView('result') }

  const NAV_LINKS = [
    { v: 'home',    label: 'Home'         },
    { v: 'form',    label: 'New Analysis' },
    { v: 'history', label: 'History'      },
  ]

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: 'var(--bg-hex)' }}>

      {/* Glass blobs */}
      {theme === 'glass' && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
          <div className="absolute w-[700px] h-[700px] rounded-full -top-64 -left-32
                          bg-indigo-600/10 blur-[120px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full -bottom-40 -right-20
                          bg-violet-600/8 blur-[100px]" />
          <div className="absolute w-[350px] h-[350px] rounded-full top-1/2 left-2/3
                          -translate-y-1/2 bg-indigo-500/5 blur-[80px]" />
        </div>
      )}

      {/* Stealth corner glow */}
      {theme === 'stealth' && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
          <div className="absolute w-[400px] h-[400px] rounded-full -top-32 -right-32
                          bg-red-900/20 blur-[80px]" />
        </div>
      )}

      {/* ── Nav ── */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between
                         sticky top-0 z-50 transition-all duration-300"
              style={{
                backgroundColor: theme === 'glass' ? undefined : 'var(--bg-hex)',
                backdropFilter:   theme === 'glass' ? 'blur(24px)' : undefined,
              }}>
        <Logo onClick={() => setView('home')} />

        <div className="flex items-center gap-4">
          <StatusPill health={health} />

          <nav className="flex gap-1">
            {NAV_LINKS.map(({ v, label }) => (
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

          <ThemeSwitcher />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full relative z-10">
        {view === 'home' && (
          <div className="fade-in-up">
            <LandingPage onStart={() => setView('form')} />
          </div>
        )}
        {view === 'form' && (
          <div className="fade-in-up">
            <FormStepper onComplete={handleAnalysisDone} />
          </div>
        )}
        {view === 'result' && analysis && (
          <div className="fade-in-up">
            <Dashboard analysis={analysis} onNewAnalysis={() => setView('form')} />
          </div>
        )}
        {view === 'history' && (
          <div className="fade-in-up">
            <AnalysisHistory onSelect={handleSelectHistory} />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-3 flex items-center justify-between
                         text-neutral-700 font-mono text-xs relative z-10"
              style={{ backgroundColor: theme === 'glass' ? undefined : 'var(--bg-hex)',
                       backdropFilter:   theme === 'glass' ? 'blur(24px)' : undefined }}>
        <span>SERAi v1.0 — Local-only · No data leaves your machine</span>
        <span>For authorized security assessments only</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
