import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'

const ALLOWED_MODELS = new Set(['qwen3.5:4b', 'qwen3:4b-instruct'])

const MODEL_META = {
  'qwen3:4b-instruct':    { family: 'Qwen 3',     size: '4B',  disk: '~2.5 GB', use: 'Chat-tuned, fast, structured output',                 recommended: true  },
  'qwen3.5:4b':           { family: 'Qwen 3.5',   size: '4B',  disk: '~3.4 GB', use: 'Reasoning model with thinking mode (slower)',         recommended: false },
  'llama3.2:3b-instruct': { family: 'Llama 3.2',  size: '3B',  disk: '~2.0 GB', use: 'Fast, chat-friendly, good for short answers',          recommended: false },
  'phi3:mini':             { family: 'Phi-3',      size: '3.8B', disk: '~2.3 GB', use: 'Microsoft, good reasoning, slower',                    recommended: false },
  'mistral:7b-instruct':   { family: 'Mistral',    size: '7B',  disk: '~4.1 GB', use: 'High quality, slower, needs more RAM',                 recommended: false },
  'gemma2:2b-instruct':    { family: 'Gemma 2',    size: '2B',  disk: '~1.6 GB', use: 'Smallest, fastest, weaker JSON',                       recommended: false },
}

const defaultMeta = (name) => ({
  family: name.split(':')[0] || name,
  size: '?',
  disk: '?',
  use: 'Custom model — no metadata available',
  recommended: false,
})

const getMeta = (name) => MODEL_META[name] || defaultMeta(name)

function shortName(name) {
  if (!name) return ''
  const [base, tag] = name.split(':')
  if (!tag) return base
  return tag.length > 10 ? `${base}:${tag.slice(0, 8)}…` : name
}

export default function ModelSelector() {
  const [models, setModels]         = useState([])
  const [active, setActive]         = useState('')
  const [open, setOpen]             = useState(false)
  const [switching, setSwitching]   = useState(false)
  const ref                         = useRef(null)
  const { toast }                   = useToast()
  const base                        = import.meta.env.DEV ? 'http://localhost:8000' : ''

  useEffect(() => {
    axios.get(`${base}/api/models`).then(r => {
      setModels(r.data.models || [])
      const serverActive = r.data.active || ''
      const saved        = localStorage.getItem('serai_model')
      if (saved && saved !== serverActive) {
        axios.post(`${base}/api/settings/model`, { model: saved })
          .then(() => setActive(saved))
          .catch(() => setActive(serverActive))
      } else {
        setActive(serverActive)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function selectModel(name) {
    if (name === active || switching) return
    setSwitching(true)
    try {
      await axios.post(`${base}/api/settings/model`, { model: name })
      localStorage.setItem('serai_model', name)
      setActive(name)
      setOpen(false)
      toast.success(`Model: ${name}`)
    } catch {
      toast.error('Failed to switch model.')
    } finally {
      setSwitching(false)
    }
  }

  // Only show models in the allowlist
  const visibleModels = models.filter(m => ALLOWED_MODELS.has(m.name))

  if (!active) return null

  // Empty state: no supported models installed
  if (visibleModels.length === 0) {
    return (
      <div ref={ref} className="relative hidden lg:block">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 font-mono text-xs text-yellow-400/80 hover:text-yellow-300
                     transition-colors border border-yellow-500/30 px-2.5 py-1 rounded-sm hover:border-yellow-500/50"
          title="No supported models installed"
        >
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.74L13.74 4a2 2 0 00-3.48 0L3.34 16.26A2 2 0 005.07 19z" />
          </svg>
          <span>No model</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full right-0 mt-1 z-[300] w-72 bg-bg/95 backdrop-blur-md
                         border border-yellow-500/30 rounded-sm shadow-2xl p-3"
            >
              <div className="font-mono text-xs text-yellow-300 uppercase tracking-wider mb-2">
                No supported models installed
              </div>
              <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                Pull one of the supported models:
              </p>
              <div className="space-y-1.5">
                {Array.from(ALLOWED_MODELS).map(name => (
                  <code key={name} className="block font-mono text-[11px] text-accent bg-black/30 border border-border/40 px-2 py-1.5 rounded-sm">
                    ollama pull {name}
                  </code>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 font-mono text-xs text-neutral-400 hover:text-neutral-200
                   transition-colors border border-border/50 px-2.5 py-1 rounded-sm hover:border-border"
        title="Switch LLM model"
      >
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
        <span>{shortName(active)}</span>
        <svg className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 z-[300] w-80 bg-bg/95 backdrop-blur-md
                       border border-accent/30 rounded-sm shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border/50 bg-black/20">
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                LLM Model
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto p-1.5 space-y-1.5">
              {visibleModels.map(m => {
                const meta      = getMeta(m.name)
                const isCurrent = m.name === active
                return (
                  <button
                    key={m.name}
                    onClick={() => selectModel(m.name)}
                    disabled={switching}
                    className={`w-full text-left p-2.5 rounded-sm transition-all duration-150
                      ${isCurrent
                        ? 'bg-accent/10 border border-accent/40'
                        : 'border border-border/40 hover:border-accent/30 hover:bg-white/3'}
                      ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isCurrent ? (
                          <svg className="w-3 h-3 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-3 h-3 shrink-0 mt-0.5" />
                        )}
                        <span className={`font-mono text-xs truncate font-semibold ${isCurrent ? 'text-accent' : 'text-neutral-200'}`}>
                          {m.name}
                        </span>
                      </div>
                      {isCurrent && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-accent bg-accent/15 border border-accent/30 px-1.5 py-0.5 shrink-0">
                          Active
                        </span>
                      )}
                      {meta.recommended && !isCurrent && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 shrink-0">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500 mb-1">
                      {meta.family} · {meta.size} · {meta.disk}
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-snug">
                      {meta.use}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="px-3 py-2 border-t border-border/50 bg-black/20">
              <div className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest mb-1">
                Add more
              </div>
              <code className="block font-mono text-[10px] text-accent/80">
                ollama pull &lt;modelname&gt;
              </code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
