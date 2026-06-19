import { useCallback, useEffect, useState } from 'react'

const DRAFT_PREFIX = 'serai-draft-'

function key(analysisId) {
  return `${DRAFT_PREFIX}${analysisId}`
}

/**
 * localStorage-backed draft persistence. Mirrors what the backend stores
 * so the user can view their partial result even if the API call fails
 * (offline / network drop / backend restart).
 */
export function useDraft(analysisId) {
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (!analysisId) {
      setDraft(null)
      return
    }
    try {
      const raw = localStorage.getItem(key(analysisId))
      setDraft(raw ? JSON.parse(raw) : null)
    } catch {
      setDraft(null)
    }
  }, [analysisId])

  const save = useCallback((payload) => {
    if (!analysisId) return null
    const record = { ...payload, savedAt: new Date().toISOString() }
    try {
      localStorage.setItem(key(analysisId), JSON.stringify(record))
      setDraft(record)
    } catch {
      // localStorage might be full or disabled
    }
    return record
  }, [analysisId])

  const clear = useCallback(() => {
    if (!analysisId) return
    try {
      localStorage.removeItem(key(analysisId))
    } catch {}
    setDraft(null)
  }, [analysisId])

  return { draft, save, clear }
}

/**
 * Discover a draft for a given company name by scanning the localStorage
 * keys. Returns the most recent draft (across all analysis IDs).
 */
export function findDraftForCompany(companyName) {
  if (!companyName) return null
  const target = companyName.toLowerCase()
  const matches = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(DRAFT_PREFIX)) continue
      try {
        const raw = localStorage.getItem(k)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        if ((parsed.company_name || '').toLowerCase() === target) {
          matches.push({ ...parsed, key: k })
        }
      } catch {}
    }
  } catch {}
  matches.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
  return matches[0] || null
}
