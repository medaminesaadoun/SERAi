export default function DigitalFootprintSection({ data, setData }) {
  const fields = [
    {
      key: 'social_media_presence',
      label: 'Social Media Presence',
      placeholder: 'e.g. LinkedIn (800 followers, employees post about projects), Twitter (active), Facebook (inactive)',
      rows: 2,
    },
    {
      key: 'website_info',
      label: 'Website Intelligence',
      placeholder: 'e.g. Hosted on AWS us-east-1, Cloudflare DNS, WordPress 6.x, WHOIS: registered 2015, email on contact page...',
      rows: 2,
    },
    {
      key: 'news_mentions',
      label: 'News / Press Mentions',
      placeholder: 'e.g. TechCrunch article naming CTO, press release about new ERP rollout, breach mentioned in 2022...',
      rows: 2,
    },
    {
      key: 'github_repos',
      label: 'GitHub / Public Repos',
      placeholder: 'e.g. github.com/company — 12 public repos, found .env file in commit history, internal API keys in old commit...',
      rows: 2,
    },
    {
      key: 'pastebin_leaks',
      label: 'Pastebin / Leak Sites',
      placeholder: 'e.g. Employee credentials found on HaveIBeenPwned, internal emails in Pastebin dump...',
      rows: 2,
    },
    {
      key: 'other_exposure',
      label: 'Other Digital Exposure',
      placeholder: 'e.g. Shodan findings, Wayback Machine reveals old admin panels, Google dorks found sensitive PDFs...',
      rows: 2,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">// Section 04</div>
        <h2 className="text-xl font-bold text-white">Empreinte Digitale</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Document the organization's digital footprint across online sources.
        </p>
      </div>

      {fields.map(({ key, label, placeholder, rows }) => (
        <div key={key}>
          <label className="serai-label">{label}</label>
          <textarea
            className="serai-input resize-none"
            rows={rows}
            placeholder={placeholder}
            value={data[key]}
            onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
          />
        </div>
      ))}
    </div>
  )
}
