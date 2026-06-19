export const MITRE_TACTICS = [
  {
    id: 'TA0043',
    short: 'Recon',
    name: 'Reconnaissance',
    description: 'Gather information to plan future operations',
    color: '#06b6d4',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  {
    id: 'TA0042',
    short: 'Resource',
    name: 'Resource Development',
    description: 'Establish resources for operations',
    color: '#0ea5e9',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    id: 'TA0001',
    short: 'Initial',
    name: 'Initial Access',
    description: 'Get into your network',
    color: '#3b82f6',
    icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
  },
  {
    id: 'TA0002',
    short: 'Execute',
    name: 'Execution',
    description: 'Run malicious code',
    color: '#6366f1',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    id: 'TA0003',
    short: 'Persist',
    name: 'Persistence',
    description: 'Maintain foothold',
    color: '#8b5cf6',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  {
    id: 'TA0004',
    short: 'PrivEsc',
    name: 'Privilege Escalation',
    description: 'Gain higher-level permissions',
    color: '#a855f7',
    icon: 'M5 10l7-7m0 0l7 7m-7-7v18',
  },
  {
    id: 'TA0005',
    short: 'Evade',
    name: 'Defense Evasion',
    description: 'Avoid being detected',
    color: '#d946ef',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    id: 'TA0006',
    short: 'Cred',
    name: 'Credential Access',
    description: 'Steal account names and passwords',
    color: '#ec4899',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  {
    id: 'TA0007',
    short: 'Discover',
    name: 'Discovery',
    description: 'Explore your environment',
    color: '#f43f5e',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7',
  },
  {
    id: 'TA0008',
    short: 'Lateral',
    name: 'Lateral Movement',
    description: 'Move through your environment',
    color: '#ef4444',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
  {
    id: 'TA0009',
    short: 'Collect',
    name: 'Collection',
    description: 'Gather data of interest',
    color: '#f97316',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    id: 'TA0011',
    short: 'C2',
    name: 'Command & Control',
    description: 'Communicate with compromised systems',
    color: '#eab308',
    icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  },
  {
    id: 'TA0010',
    short: 'Exfil',
    name: 'Exfiltration',
    description: 'Steal data',
    color: '#dc2626',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  },
  {
    id: 'TA0040',
    short: 'Impact',
    name: 'Impact',
    description: 'Manipulate, interrupt, or destroy systems',
    color: '#991b1b',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
]

export const TACTICS_BY_ID = MITRE_TACTICS.reduce((acc, t) => {
  acc[t.id] = t
  return acc
}, {})

export function getTactic(id) {
  return TACTICS_BY_ID[id] || null
}
