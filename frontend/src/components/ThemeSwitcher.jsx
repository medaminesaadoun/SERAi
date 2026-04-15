import { useTheme, THEMES } from '../context/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-px bg-card border border-border p-0.5 rounded-sm">
      {Object.entries(THEMES).map(([key, meta]) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          title={meta.desc}
          className={`
            font-mono text-xs px-2.5 py-1 transition-all duration-200 rounded-sm
            ${theme === key
              ? 'bg-accent text-bg font-bold'
              : 'text-neutral-500 hover:text-neutral-300'}
          `}
        >
          <span className="mr-1">{meta.icon}</span>
          {meta.label}
        </button>
      ))}
    </div>
  )
}
