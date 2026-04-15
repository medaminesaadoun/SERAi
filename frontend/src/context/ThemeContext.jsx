import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  glass:   { label: 'Glass',   icon: '◈', desc: 'Frosted indigo'      },
  cyber:   { label: 'Cyber',   icon: '⬡', desc: 'Lime green terminal' },
  stealth: { label: 'Stealth', icon: '◉', desc: 'Red team black'      },
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('serai-theme') || 'glass'
  )

  useEffect(() => {
    const html = document.documentElement
    Object.keys(THEMES).forEach(t => html.classList.remove(`theme-${t}`))
    html.classList.add(`theme-${theme}`)
    localStorage.setItem('serai-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
