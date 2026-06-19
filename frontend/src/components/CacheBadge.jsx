import { useMemo } from 'react'

function formatAge(createdAt) {
  if (!createdAt) return 'cached'
  const ms = Date.now() - new Date(createdAt).getTime()
  if (ms < 0) return 'just now'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function CacheBadge({ cache, elapsedMs, model }) {
  const isHit = cache?.hit === true
  const label = useMemo(() => {
    if (isHit) {
      const t = elapsedMs != null ? `${elapsedMs}ms` : '0ms'
      return { primary: `⚡ ${t}`, sub: `cached · ${formatAge(cache.created_at)}` }
    }
    if (elapsedMs != null) {
      return { primary: `⏱ ${(elapsedMs / 1000).toFixed(1)}s`, sub: 'freshly generated' }
    }
    return { primary: '⏱ —', sub: 'generating' }
  }, [isHit, elapsedMs, cache?.created_at])

  const color = isHit ? '#22c55e' : 'rgb(var(--color-accent))'
  const bg = isHit ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)'

  return (
    <div
      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm shrink-0"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}33` }}
      title={isHit ? `Instant result from cache · model: ${model || '?'}` : `Newly generated · model: ${model || '?'}`}
    >
      <span className="font-bold">{label.primary}</span>
      <span className="opacity-60">·</span>
      <span className="opacity-70 normal-case tracking-normal">{label.sub}</span>
    </div>
  )
}
