/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      'rgb(var(--color-bg)      / <alpha-value>)',
        card:    'rgb(var(--color-card)    / <alpha-value>)',
        border:  'rgb(var(--color-border)  / <alpha-value>)',
        accent:  'rgb(var(--color-accent)  / <alpha-value>)',
        accent2: 'rgb(var(--color-accent2) / <alpha-value>)',
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', 'Consolas', 'monospace'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Chakra Petch"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
