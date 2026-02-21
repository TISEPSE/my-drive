import { createContext, useContext, useEffect, useState } from 'react'

const DARK_THEMES = new Set(['dark', 'midnight', 'nord', 'sunset', 'forest', 'ocean', 'rose', 'dracula'])
const STORAGE_KEY = 'cloudspace-theme'

function applyThemeToDom(theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.classList.toggle('dark', DARK_THEMES.has(theme))
    root.setAttribute('data-theme', theme)
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || 'dark'
    applyThemeToDom(stored)
    return stored
  })

  // Handle system theme: respond to OS changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      document.documentElement.classList.toggle('dark', e.matches)
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyThemeToDom(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
