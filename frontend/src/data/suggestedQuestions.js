export const SUGGESTED_QUESTIONS = {
  generic: [
    'What are the top 3 mitigations I should prioritize this week?',
    'Explain the highest-impact attack scenario in more detail.',
    'How would I detect the credential exposure attack?',
  ],
  attack: [
    'Walk me through the reconnaissance phase an attacker would run first.',
    'What OSINT tools would I use to map the digital footprint?',
    'How do I weaponize the job-posting leakage into a phishing payload?',
  ],
  defense: [
    'How do I detect spear-phishing against the C-suite in our SIEM?',
    'What detection rules should I write for the credential-harvesting scenario?',
    'How do I contain an AWS key leak in under one hour?',
  ],
}

export function getSuggestions(mode = 'attack', limit = 4) {
  const isAtk = mode === 'attack'
  const generic = SUGGESTED_QUESTIONS.generic.slice(0, 2)
  const specific = isAtk ? SUGGESTED_QUESTIONS.attack : SUGGESTED_QUESTIONS.defense
  const pool = [...generic, ...specific].slice(0, limit)
  return pool
}
