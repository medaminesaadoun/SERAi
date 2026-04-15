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

export default function LandingPage({ onStart }) {
  const [radarVisible, setRadarVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRadarVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <WelcomeBanner />

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col justify-center py-16 overflow-hidden">

        {/* Drifting grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgb(var(--color-accent) / 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgb(var(--color-accent) / 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            animation: 'grid-drift 28s linear infinite',
          }}
        />

        {/* Corner crosshairs */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-10 h-10 pointer-events-none`}
               style={{ transform: `rotate(${i * 90}deg)` }}>
            <div className="absolute top-0 left-0 w-full h-px"
                 style={{ background: 'rgb(var(--color-accent) / 0.35)' }} />
            <div className="absolute top-0 left-0 h-full w-px"
                 style={{ background: 'rgb(var(--color-accent) / 0.35)' }} />
          </div>
        ))}

        <div className="relative z-10">
          {/* Status badge */}
          <div className="fade-in-up flex items-center gap-2.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase"
                  style={{ color: 'rgb(var(--color-accent) / 0.65)' }}>
              Local AI · OSINT · MITRE ATT&CK
            </span>
          </div>

          {/* MASSIVE logo */}
          <div className="fade-in-up mb-4" style={{ animationDelay: '0.06s' }}>
            <h1
              className="font-display font-bold leading-[0.88] tracking-tight"
              style={{ fontSize: 'clamp(4.5rem, 17vw, 11rem)' }}
            >
              <span style={{ color: 'rgb(var(--color-accent))' }}>SER</span>
              <span className="text-white">A</span>
              <span className="relative inline-flex items-start">
                <span className="text-white">i</span>
                <span
                  className="absolute rounded-full bg-accent"
                  style={{
                    width: '0.13em', height: '0.13em',
                    top: '0.08em', left: '50%',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 0.18em 0.1em rgb(var(--color-accent) / 0.55)',
                  }}
                />
              </span>
            </h1>

            {/* Rule */}
            <div className="flex items-center gap-3 mt-4">
              <div className="h-px flex-1 max-w-sm"
                   style={{ background: 'linear-gradient(to right, rgb(var(--color-accent) / 0.55), transparent)' }} />
              <span className="font-mono text-xs tracking-widest"
                    style={{ color: 'rgb(var(--color-accent) / 0.35)' }}>v1.0</span>
            </div>
          </div>

          {/* Two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start mt-6">

            {/* Left — text + CTA */}
            <div className="fade-in-up" style={{ animationDelay: '0.12s' }}>
              <p className="font-display text-lg text-neutral-400 leading-relaxed mb-3">
                Social Engineering Risk Analyzer
              </p>
              <p className="text-neutral-600 leading-relaxed mb-8 max-w-md">
                Assess your organization's attack surface using public OSINT data and a
                local AI model. All analysis stays on your machine — no cloud, no telemetry.
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                <button
                  onClick={onStart}
                  className="serai-btn-primary text-base px-8 py-3.5 flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Start Analysis
                </button>
                <a href="#how-it-works" className="serai-btn-secondary text-base flex items-center gap-2">
                  How it works ↓
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8"
                   style={{ borderTop: '1px solid rgb(var(--color-border) / 0.5)' }}>
                {[
                  ['4',     'Risk dimensions'],
                  ['100%',  'Local processing'],
                  ['MITRE', 'ATT&CK mapped'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <div className="font-display text-2xl font-bold mb-1"
                         style={{ color: 'rgb(var(--color-accent))' }}>{v}</div>
                    <div className="font-mono text-xs tracking-widest uppercase text-neutral-700">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — preview card */}
            <div className="fade-in-up relative" style={{ animationDelay: '0.18s' }}>
              <div className="serai-card p-5 relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-mono text-xs mb-1"
                         style={{ color: 'rgb(var(--color-accent) / 0.55)' }}>// Sample output</div>
                    <div className="font-display font-semibold text-neutral-300">Acme Corp</div>
                  </div>
                  <div className="border font-mono font-bold text-xs px-3 py-1 tracking-widest
                                  border-orange-500/30 bg-orange-500/10 text-orange-400">
                    HIGH
                  </div>
                </div>

                {radarVisible && (
                  <div className="fade-in-up"><RadarChart scores={MOCK_SCORES} /></div>
                )}

                <div className="space-y-2.5 mt-4">
                  {[
                    ['People',            74, '#f97316', '0.9s'],
                    ['Technology',        61, '#eab308', '1.0s'],
                    ['Processes',         42, '#22c55e', '1.1s'],
                    ['Digital Footprint', 83, '#ef4444', '1.2s'],
                  ].map(([label, val, color, delay]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-600">{label}</span>
                        <span className="font-mono font-bold" style={{ color }}>{val}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgb(var(--color-border) / 0.4)' }}>
                        <div className="h-full rounded-full animated-bar"
                             style={{ '--bar-w': `${val}%`, '--bar-delay': delay, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-3 -left-3 serai-card px-3 py-2 shadow-2xl">
                <div className="flex items-center gap-2 font-mono text-xs"
                     style={{ color: 'rgb(var(--color-accent))' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  No data transmitted
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16"
               style={{ borderTop: '1px solid rgb(var(--color-border) / 0.4)' }}>
        <div className="text-center mb-12 fade-in-up">
          <div className="font-mono text-xs uppercase tracking-widest mb-2"
               style={{ color: 'rgb(var(--color-accent) / 0.65)' }}>// Workflow</div>
          <h2 className="font-display text-3xl font-bold">How it works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FLOW.map((f, i) => (
            <div key={f.step}
                 className="serai-card p-6 fade-in-up relative overflow-hidden group
                             hover:border-accent/30 transition-all duration-300"
                 style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="font-display text-6xl font-bold absolute top-3 right-4
                               pointer-events-none select-none transition-colors duration-300"
                   style={{ color: 'rgb(var(--color-accent) / 0.07)',
                            fontSize: '5rem' }}>
                {f.step}
              </div>
              <div className="font-mono text-sm font-bold mb-2"
                   style={{ color: 'rgb(var(--color-accent))' }}>{f.step}</div>
              <div className="font-display font-bold text-lg mb-2 text-neutral-200">{f.title}</div>
              <div className="text-sm text-neutral-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════ */}
      <section className="py-16" style={{ borderTop: '1px solid rgb(var(--color-border) / 0.4)' }}>
        <div className="text-center mb-12 fade-in-up">
          <div className="font-mono text-xs uppercase tracking-widest mb-2"
               style={{ color: 'rgb(var(--color-accent) / 0.65)' }}>// Four dimensions</div>
          <h2 className="font-display text-3xl font-bold">What gets analyzed</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title}
                 className="serai-card p-6 flex gap-4 fade-in-up
                             hover:border-accent/25 transition-all duration-300 group"
                 style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center
                               border transition-all duration-300"
                   style={{
                     background: 'rgb(var(--color-accent) / 0.08)',
                     borderColor: 'rgb(var(--color-accent) / 0.2)',
                     color: 'rgb(var(--color-accent))',
                   }}>
                {f.icon}
              </div>
              <div>
                <div className="font-display font-bold text-base mb-1 text-neutral-200">{f.title}</div>
                <div className="text-sm text-neutral-500 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ DISCLAIMER ════════════════════════════════════════════════ */}
      <section className="py-10" style={{ borderTop: '1px solid rgb(var(--color-border) / 0.4)' }}>
        <div className="serai-card p-5 flex gap-4 items-start fade-in-up">
          <div className="shrink-0 text-yellow-500 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="font-display font-semibold text-neutral-300 mb-1">
              For authorized assessments only
            </div>
            <div className="text-sm text-neutral-500 leading-relaxed">
              SERAi is strictly for security professionals with explicit written authorization from the target
              organization. Unauthorized security testing may violate computer crime laws in your jurisdiction.
              All analysis is performed locally — no data is ever transmitted to external servers.
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════ */}
      <section className="py-16 text-center fade-in-up">
        <div className="font-mono text-xs uppercase tracking-widest mb-3"
             style={{ color: 'rgb(var(--color-accent) / 0.55)' }}>
          // Ready to assess?
        </div>
        <h2 className="font-display text-2xl font-bold mb-6 text-neutral-200">
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
