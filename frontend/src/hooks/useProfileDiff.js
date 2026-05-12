import { useMemo } from 'react'

function flattenSection(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenSection(v, key))
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v)
    } else {
      out[key] = String(v ?? '')
    }
  }
  return out
}

export function useProfileDiff(baseline, current) {
  return useMemo(() => {
    if (!baseline) return { changedFields: new Set(), changedBySection: {}, totalChanges: 0 }

    const flatBaseline = flattenSection(baseline)
    const flatCurrent = flattenSection(current)

    const changedFields = new Set()
    for (const key of new Set([...Object.keys(flatBaseline), ...Object.keys(flatCurrent)])) {
      if (flatBaseline[key] !== flatCurrent[key]) {
        changedFields.add(key)
      }
    }

    const sections = ['people', 'technology', 'processes', 'digital_footprint']
    const changedBySection = {}
    for (const section of sections) {
      changedBySection[section] = [...changedFields].filter(k => k.startsWith(section + '.')).length
    }
    if (String(current.company_name ?? '') !== String(baseline.company_name ?? '')) {
      changedBySection.company_name = 1
    }

    return { changedFields, changedBySection, totalChanges: changedFields.size }
  }, [baseline, current])
}
