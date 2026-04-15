import { useEffect, useState } from 'react'
import RadarChart from './RadarChart'
import { WelcomeBanner } from './OnboardingTooltip'

const MOCK_SCORES = { people: 74, technology: 61, processes: 42, digital_footprint: 83 }

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'People Exposure',
    desc: 'Map employee visibility across LinkedIn, org charts, press releases, and public directories.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-13.5 0v-1.5m13.5 1.5v-1.5m0 0a3 3 0 00-3-3H8.25a3 3 0 00-3 3m13.5 0v1.5a3 3 0 01-3 3" />
      </svg>
    ),
    title: 'Tech Fingerprinting',
    desc: 'Identify exposed services, job-posting tool leaks, cloud providers, and public-facing infrastructure.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
    title: 'Process Intelligence',
    desc: 'Uncover ticketing systems, onboarding docs, vendor relationships, and internal workflows left exposed.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
      </svg>
    ),
    title: 'Digital Footprint',
    desc: 'Analyze GitHub repos, social media presence, news mentions, paste sites, and dark web exposure.',
  },
]

const FLOW = [
  { step: '01', title: 'Collect OSINT',   desc: 'Fill in the 4-section structured form with publicly available data about the target organization.' },
  { step: '02', title: 'AI Analysis',     desc: 'A local LLM (qwen3.5:4b via Ollama) analyzes the attack surface and generates structured findings.' },
  { step: '03', title: 'Get Your Report', desc: 'Review the interactive dashboard and download a CONFIDENTIEL-watermarked PDF report.' },
]

/* Typewriter hook — types one phrase, keeps cursor blinking */
function useTypewriter(phrase, speed = 55, startDelay = 400) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    setText('')
    setDone(false)
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setText(phrase.slice(0, i))
        if (i >= phrase.length) { clearInterval(interval); setDone(true) }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(delay)
  }, [phrase, speed, startDelay])

  return { text, done }
}

/* Animated counter */
function Counter({ target, suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = performance.now()
    const raf = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return <>{val}{suffix}</>
}

export default function LandingPage({ onStart }) {
  const { text, done } = useTypewriter('Social Engineering Risk Analyzer', 50, 300)
  const [radarVisible, setRadarVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRadarVisible(true), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="max-w-6xl mx-auto">

      <WelcomeBanner />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="min-h-[80vh] flex flex-col lg:flex-row items-center gap-12 py-16">

        {/* Left — text */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <div className="fade-in-up inline-flex items-center gap-2 border border-accent/30 bg-accent/5
                          px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs text-accent tracking-wider uppercase">
              Local-only · No data leaves your machine
            </span>
          </div>

          {/* Main logo / heading */}
          <div className="fade-in-up mb-4" style={{ animationDelay: '0.05s' }}>
            <h1 className="font-mono font-black leading-none mb-1" style={{ fontSize: 'clamp(3rem,8vw,5.5rem)' }}>
              <span className="text-accent">SER</span>
              <span className="text-white">A</span>
              <span className="relative inline-flex items-start">
                <span className="text-white">i</span>
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-4 border-bg"
                  style={{ boxShadow: '0 0 16px 4px rgb(var(--color-accent) / 0.7)' }}
                />
              </span>
            </h1>
          </div>

          {/* Typewriter tagline */}
          <div className="fade-in-up mb-6 h-8" style={{ animationDelay: '0.1s' }}>
            <span className="font-mono text-lg text-neutral-400 tracking-wide">
              {text}
              <span className={`inline-block w-0.5 h-5 bg-accent ml-0.5 align-middle
                               ${done ? 'animate-pulse' : ''}`} />
            </span>
          </div>

          {/* Sub-description */}
          <p className="fade-in-up text-neutral-500 text-base leading-relaxed max-w-lg mb-8"
             style={{ animationDelay: '0.15s' }}>
            Assess your organization's social engineering attack surface using public OSINT data
            and a local AI model. All analysis stays on your machine — no cloud, no telemetry.
          </p>

          {/* CTAs */}
          <div className="fade-in-up flex flex-wrap gap-3" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={onStart}
              className="serai-btn-primary flex items-center gap-2 text-base px-8 py-3.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Start Analysis
            </button>
            <a href="#how-it-works"
               className="serai-btn-secondary flex items-center gap-2 text-base">
              How it works ↓
            </a>
          </div>

          {/* Stat pills */}
          <div className="fade-in-up flex flex-wrap gap-3 mt-10" style={{ animationDelay: '0.25s' }}>
            {[
              ['4', 'Risk dimensions'],
              ['100%', 'Local processing'],
              ['MITRE', 'ATT&CK mapped'],
            ].map(([val, label]) => (
              <div key={label}
                   className="flex items-center gap-2 bg-white/3 border border-border/60 rounded-full px-4 py-1.5">
                <span className="font-mono font-bold text-sm text-accent">{val}</span>
                <span className="text-neutral-500 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — live radar preview */}
        <div className="fade-in-up flex-shrink-0 w-full lg:w-[420px]" style={{ animationDelay: '0.3s' }}>
          <div className="serai-card p-6 relative overflow-hidden">
            {/* Card top shimmer */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">
                  // Sample output
                </div>
                <div className="font-semibold text-neutral-300">Acme Corp</div>
              </div>
              <div className="border border-orange-500/30 bg-orange-500/10 text-orange-400
                              font-mono font-bold text-xs px-3 py-1 tracking-widest">
                HIGH
              </div>
            </div>

            {/* Radar */}
            {radarVisible && (
              <div className="fade-in-up">
                <RadarChart scores={MOCK_SCORES} />
              </div>
            )}

            {/* Dimension bars */}
            <div className="space-y-2.5 mt-4">
              {[
                ['People',           74, '#f97316', '0.9s'],
                ['Technology',       61, '#eab308', '1.0s'],
                ['Processes',        42, '#22c55e', '1.1s'],
                ['Digital Footprint',83, '#ef4444', '1.2s'],
              ].map(([label, val, color, delay]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">{label}</span>
                    <span className="font-mono font-bold" style={{ color }}>{val}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full animated-bar"
                         style={{ '--bar-w': `${val}%`, '--bar-delay': delay, background: color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Floating glow blob behind card */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full
                            bg-accent/5 blur-2xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 border-t border-border/40">
        <div className="text-center mb-12 fade-in-up">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2">// Workflow</div>
          <h2 className="text-3xl font-bold">How it works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FLOW.map((f, i) => (
            <div key={f.step}
                 className="serai-card p-6 fade-in-up relative overflow-hidden group
                             hover:border-accent/30 transition-all duration-300"
                 style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="font-mono text-5xl font-black text-accent/10 absolute top-4 right-5
                               group-hover:text-accent/20 transition-colors duration-300 select-none">
                {f.step}
              </div>
              <div className="font-mono font-bold text-accent text-sm mb-2 tracking-wider">{f.step}</div>
              <div className="font-bold text-lg mb-2 text-neutral-200">{f.title}</div>
              <div className="text-sm text-neutral-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-16 border-t border-border/40">
        <div className="text-center mb-12 fade-in-up">
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2">// Four dimensions</div>
          <h2 className="text-3xl font-bold">What gets analyzed</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title}
                 className="serai-card p-6 flex gap-4 fade-in-up
                             hover:border-accent/25 transition-all duration-300 group"
                 style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center
                               bg-accent/8 border border-accent/20 text-accent
                               group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-300">
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-base mb-1 text-neutral-200">{f.title}</div>
                <div className="text-sm text-neutral-500 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DISCLAIMER ───────────────────────────────────────── */}
      <section className="py-10 border-t border-border/40">
        <div className="serai-card p-5 flex gap-4 items-start fade-in-up">
          <div className="shrink-0 text-yellow-500 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-neutral-300 mb-1">For authorized assessments only</div>
            <div className="text-sm text-neutral-500 leading-relaxed">
              SERAi is strictly for security professionals with explicit written authorization from the target
              organization. Unauthorized security testing may violate computer crime laws. All analysis is
              performed locally — no data is ever transmitted to external servers.
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-12 text-center fade-in-up">
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
          // Ready to assess?
        </div>
        <h2 className="text-2xl font-bold mb-6 text-neutral-200">
          Start your first analysis in minutes
        </h2>
        <button
          onClick={onStart}
          className="serai-btn-primary text-base px-10 py-4 inline-flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Start Analysis
        </button>
      </section>

    </div>
  )
}
