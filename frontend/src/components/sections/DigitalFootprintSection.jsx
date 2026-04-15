import { FieldHint, SectionProgress, OsintResources } from './FormHelpers'

const OSINT_TOOLS = [
  { name: 'HaveIBeenPwned', url: 'https://haveibeenpwned.com',   desc: 'Domain breach check — leaked employee credentials' },
  { name: 'Shodan',         url: 'https://shodan.io',            desc: 'Internet-facing assets, banners, open ports' },
  { name: 'WHOIS / DomainTools', url: 'https://whois.domaintools.com', desc: 'Registrant info, registration date, DNS history' },
  { name: 'Wayback Machine',url: 'https://web.archive.org',      desc: 'Archived versions of the website, old admin pages' },
  { name: 'GitHub Search',  url: 'https://github.com/search',    desc: 'Search company name — find public repos & secrets' },
  { name: 'IntelX',         url: 'https://intelx.io',            desc: 'Paste sites, breach data, dark web mentions' },
]

const FIELDS = [
  {
    key: 'social_media_presence',
    label: 'Social Media Presence',
    placeholder: 'e.g. LinkedIn (1.2k followers, employees post project updates), Twitter/X (active, 3k followers), Facebook (inactive)…',
    rows: 2,
    hint: 'Note which platforms are active and whether employees share internal information (product launches, office photos, tool names). High employee activity = higher OSINT surface.',
  },
  {
    key: 'website_info',
    label: 'Website Intelligence',
    placeholder: 'e.g. Hosted on AWS us-east-1, Cloudflare DNS, WordPress 6.x, WHOIS shows registered 2015, contact page exposes personal email…',
    rows: 2,
    hint: 'Run the domain through BuiltWith for hosting/stack. Check WHOIS for registrant details. Use browser DevTools to inspect headers (Server, X-Powered-By). View source for HTML comments or version strings.',
  },
  {
    key: 'news_mentions',
    label: 'News / Press Mentions',
    placeholder: 'e.g. TechCrunch article names CTO and mentions new Azure migration, press release reveals ERP rollout timeline, security incident mentioned in 2022…',
    rows: 2,
    hint: 'Google News: "[company name]" site:techcrunch.com OR site:reuters.com. Also search for the company on SEC EDGAR if public. Annual reports and investor decks are rich sources of org and technology detail.',
  },
  {
    key: 'github_repos',
    label: 'GitHub / Public Repositories',
    placeholder: 'e.g. github.com/company — 12 public repos, .env committed in history 8 months ago, internal API base URL hardcoded in config.js…',
    rows: 2,
    hint: 'Search GitHub for the company name and domain. Use truffleHog or git-secrets concepts: look for .env files, API keys, and internal URLs in commit history. Check forks — contributors may have pushed sensitive data.',
  },
  {
    key: 'pastebin_leaks',
    label: 'Paste Sites / Breach Data',
    placeholder: 'e.g. 3 employees found in HaveIBeenPwned (LinkedIn 2021 breach), internal email thread in Pastebin dump, credentials on IntelX…',
    rows: 2,
    hint: 'Check HaveIBeenPwned for the company domain. Search IntelX and Pastebin for the company name and domain. Dehashed and LeakCheck (paid) provide deeper breach data. Note which employees appear.',
  },
  {
    key: 'other_exposure',
    label: 'Other Digital Exposure',
    placeholder: 'e.g. Shodan shows open RDP on 203.0.x.x, Wayback Machine reveals old admin panel at /admin, Google dork found internal PDF with org chart…',
    rows: 2,
    hint: 'Google dorks: site:[company.com] filetype:pdf, intitle:"index of" [company], "[company]" "internal use only". Check Shodan for the company\'s IP range. The Wayback Machine often archives pages that were meant to be private.',
  },
]

export default function DigitalFootprintSection({ data, setData }) {
  const progressValues = FIELDS.map(f => data[f.key])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 04</div>
          <h2 className="text-xl font-bold text-white">Digital Footprint</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Document the organization's online exposure across public sources.
          </p>
        </div>
        <SectionProgress values={progressValues} />
      </div>

      {FIELDS.map(({ key, label, placeholder, rows, hint }) => (
        <div key={key}>
          <label className="serai-label">{label}</label>
          <textarea
            className="serai-input resize-none"
            rows={rows}
            placeholder={placeholder}
            value={data[key]}
            onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
          />
          <FieldHint>{hint}</FieldHint>
        </div>
      ))}

      <OsintResources tools={OSINT_TOOLS} />
    </div>
  )
}
