import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../context/ToastContext'

function fmtSize(bytes) {
  if (!bytes) return ''
  return (bytes / 1e9).toFixed(1) + ' GB'
}

export default function ModelSelector() {
  const [models, setModels] = useState([])
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef(null)
  const { toast } = useToast()
  const base = import.meta.env.DEV ? 'http://localhost:8000' : ''

  useEffect(() => {
    axios.get(`${base}/api/models`).then(r => {
      setModels(r.data.models || [])
      const serverActive = r.data.active || ''
      const saved = localStorage.getItem('serai_model')
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

  if (!active || models.length <= 1) return null

  const shortName = active.length > 20 ? active.split(':')[0] + ':' + active.split(':')[1]?.slice(0, 8) + '...' : active

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 font-mono text-xs text-neutral-500 hover:text-neutral-300 transition-colors border border-border/50 px-2.5 py-1 rounded-sm hover:border-border"
        title="Switch LLM model"
      >
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
        <span>{shortName}</span>
        <svg className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-[300] min-w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border/50">
            <span className="font-mono text-xs text-neutral-600 uppercase tracking-wider">Installed Models</span>
          </div>
          {models.map(m => {
            const isCurrent = m.name === active
            return (
              <button
                key={m.name}
                onClick={() => selectModel(m.name)}
                disabled={switching}
                className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-4 transition-colors
                  ${isCurrent ? 'bg-accent/5' : 'hover:bg-white/5'}
                  ${switching ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCurrent
                    ? <svg className="w-3 h-3 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <span className="w-3 h-3 shrink-0" />
                  }
                  <span className={`font-mono text-xs truncate ${isCurrent ? 'text-accent' : 'text-neutral-300'}`}>
                    {m.name}
                  </span>
                </div>
                {m.size > 0 && (
                  <span className="font-mono text-xs text-neutral-600 shrink-0">{fmtSize(m.size)}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
