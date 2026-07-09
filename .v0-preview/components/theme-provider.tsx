'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    let initial: Theme = 'light'
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'light' || stored === 'dark') {
        initial = stored
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initial = 'dark'
      }
    } catch {
      // localStorage no disponible
    }
    setTheme(initial)
    document.documentElement.dataset.theme = initial
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem('theme', next)
      } catch {
        // localStorage no disponible
      }
      return next
    })
  }, [])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
