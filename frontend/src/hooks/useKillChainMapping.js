import { useMemo } from 'react'
import { MITRE_TACTICS, TACTICS_BY_ID, getTactic } from '../data/mitreTactics'

export function useKillChainMapping(scenarios) {
  return useMemo(() => {
    if (!scenarios || !Array.isArray(scenarios)) {
      return { stages: [], unmapped: [], hasData: false }
    }

    const byTactic = {}
    const unmapped = []

    scenarios.forEach(scenario => {
      const tacticId = scenario.mitre_tactic
      const tactic = tacticId ? getTactic(tacticId) : null

      if (tactic) {
        if (!byTactic[tacticId]) byTactic[tacticId] = []
        byTactic[tacticId].push(scenario)
      } else {
        unmapped.push(scenario)
      }
    })

    const stages = MITRE_TACTICS
      .filter(t => byTactic[t.id] && byTactic[t.id].length > 0)
      .map(t => ({
        ...t,
        scenarios: byTactic[t.id],
        maxRisk: byTactic[t.id].reduce((max, s) => {
          const score = s.impact === 'CRITICAL' ? 4 : s.impact === 'HIGH' ? 3 : s.impact === 'MEDIUM' ? 2 : 1
          return Math.max(max, score)
        }, 0),
      }))

    return {
      stages,
      unmapped,
      hasData: stages.length > 0 || unmapped.length > 0,
    }
  }, [scenarios])
}

export function getRiskColor(likelihood, impact) {
  const lvl = (v) => v === 'CRITICAL' ? 4 : v === 'HIGH' ? 3 : v === 'MEDIUM' ? 2 : 1
  const score = Math.max(lvl(likelihood), lvl(impact))
  if (score >= 4) return '#dc2626'
  if (score >= 3) return '#ef4444'
  if (score >= 2) return '#eab308'
  return '#22c55e'
}

export function getRiskLabel(likelihood, impact) {
  const lvl = (v) => v === 'CRITICAL' ? 4 : v === 'HIGH' ? 3 : v === 'MEDIUM' ? 2 : 1
  const score = Math.max(lvl(likelihood), lvl(impact))
  if (score >= 4) return 'CRITICAL'
  if (score >= 3) return 'HIGH'
  if (score >= 2) return 'MEDIUM'
  return 'LOW'
}
