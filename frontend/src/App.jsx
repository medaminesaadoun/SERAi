import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ThemeSwitcher from './components/ThemeSwitcher'
import Toaster from './components/Toaster'
import LandingPage from './components/LandingPage'
import FormStepper from './components/FormStepper'
import Dashboard from './components/Dashboard'
import AnalysisHistory from './components/AnalysisHistory'
import AnalysisLoader from './components/AnalysisLoader'
import { DEMO_ANALYSIS } from './data/demoAnalysis'

const API = '/api'

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 group shrink-0">
      <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight select-none">
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
      <span className="hidden lg:block text-neutral-600 font-mono text-xs tracking-widest uppercase">
        Social Engineering Risk Analyzer
      </span>
    </button>
  )
}

function StatusPill({ health }) {
  if (!health) return null
  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${health.ollama_connected ? 'bg-accent' : 'bg-red-500'}`} />
      <span className={`hidden sm:inline ${health.ollama_connected ? 'text-accent' : 'text-red-400'}`}>
        {health.ollama_connected ? `Ollama · ${health.model}` : 'Ollama offline'}
      </span>
    </div>
  )
}

const NAV_LINKS = [
  { v: 'home',    label: 'Home'         },
  { v: 'form',    label: 'New Analysis' },
  { v: 'history', label: 'History'      },
]

function AppInner() {
  const [view, setView]         = useState('home')
  const [analysis, setAnalysis] = useState(null)
  const [health, setHealth]     = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef                 = useRef(null)
  const { theme }               = useTheme()

  useEffect(() => {
    axios.get(`${API}/health`)
      .then(r => setHealth(r.data))
      .catch(() => setHealth({ ollama_connected: false, model: 'unknown' }))
  }, [])

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function navigate(v) { setView(v); setMenuOpen(false) }
  function handleAnalysisDone(data) { setAnalysis(data); setView('result') }
  function handleSelectHistory(data) { setAnalysis(data); setView('result') }
  function handleDemo() {
    setView('demo')
    setMenuOpen(false)
  }
  function handleDemoComplete() {
    setAnalysis({ ...DEMO_ANALYSIS, timestamp: new Date().toISOString() })
    setView('result')
  }

  const glassHeader = theme === 'glass'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }
    : { backgroundColor: 'var(--bg-hex)' }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden"
         style={{ backgroundColor: 'var(--bg-hex)' }}>
      <div id="grain-overlay" aria-hidden="true" />

      {/* Glass blobs */}
      {theme === 'glass' && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
          <div className="absolute w-[700px] h-[700px] rounded-full -top-64 -left-32 bg-indigo-600/10 blur-[120px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full -bottom-40 -right-20 bg-violet-600/8 blur-[100px]" />
          <div className="absolute w-[350px] h-[350px] rounded-full top-1/2 left-2/3 -translate-y-1/2 bg-indigo-500/5 blur-[80px]" />
        </div>
      )}

      {/* Stealth corner glow */}
      {theme === 'stealth' && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
          <div className="absolute w-[400px] h-[400px] rounded-full -top-32 -right-32 bg-red-900/20 blur-[80px]" />
        </div>
      )}

      {/* ── Nav ── */}
      <header
        className="border-b border-border px-4 sm:px-6 py-3 sticky top-0 z-50 transition-all duration-300"
        style={glassHeader}
        ref={menuRef}
      >
        <div className="flex items-center justify-between gap-3">
          <Logo onClick={() => navigate('home')} />

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-4">
            <StatusPill health={health} />
            <nav className="flex gap-1">
              {NAV_LINKS.map(({ v, label }) => (
                <button key={v} onClick={() => navigate(v)}
                  className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 transition-colors ${
                    view === v ? 'text-accent border-b border-accent' : 'text-neutral-500 hover:text-neutral-300'
                  }`}>
                  {label}
                </button>
              ))}
            </nav>
            <ThemeSwitcher />
          </div>

          {/* Mobile: status + hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <StatusPill health={health} />
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 flex items-center justify-center border border-border rounded-sm
                         text-neutral-400 hover:text-accent hover:border-accent transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-border mt-3 pt-3 pb-2 space-y-1 slide-from-right"
               style={{ animationDuration: '0.2s' }}>
            {NAV_LINKS.map(({ v, label }) => (
              <button key={v} onClick={() => navigate(v)}
                className={`w-full text-left font-mono text-sm uppercase tracking-wider px-3 py-2.5
                            rounded-sm transition-colors ${
                  view === v
                    ? 'text-accent bg-accent/8'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}>
                {label}
              </button>
            ))}
            <div className="px-3 pt-2">
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto w-full relative z-10">
        {view === 'home'    && <div className="fade-in-up"><LandingPage onStart={() => navigate('form')} onDemo={handleDemo} /></div>}
        {view === 'form'    && <div className="fade-in-up"><FormStepper onComplete={handleAnalysisDone} /></div>}
        {view === 'demo'    && <AnalysisLoader company="Acme Technologies" speed={0.28} onComplete={handleDemoComplete} />}
        {view === 'result'  && analysis && <div className="fade-in-up"><Dashboard analysis={analysis} onNewAnalysis={() => navigate('form')} /></div>}
        {view === 'history' && <div className="fade-in-up"><AnalysisHistory onSelect={handleSelectHistory} /></div>}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 sm:px-6 py-3 relative z-10"
              style={glassHeader}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1
                        text-neutral-700 font-mono text-xs">
          <span>SERAi v1.0 - Local-only · No data leaves your machine</span>
          <span>For authorized security assessments only</span>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppInner />
        <Toaster />
      </ToastProvider>
    </ThemeProvider>
  )
}
