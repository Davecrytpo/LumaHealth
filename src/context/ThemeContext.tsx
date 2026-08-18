import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Appearance } from '@shared/types'

interface ThemeState {
  appearance: Appearance
  resolved: 'light' | 'dark'
  setAppearance: (value: Appearance) => void
}

const ThemeContext = createContext<ThemeState | null>(null)

function resolve(appearance: Appearance): 'light' | 'dark' {
  if (appearance === 'system') {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return appearance
}

export function ThemeProvider({
  appearance,
  children,
}: {
  appearance: Appearance
  children: React.ReactNode
}) {
  const [current, setCurrent] = useState<Appearance>(appearance)

  useEffect(() => {
    setCurrent(appearance)
  }, [appearance])

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolve(current)
    }
    apply()
    if (typeof window.matchMedia !== 'function') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [current])

  const value = useMemo(
    () => ({
      appearance: current,
      resolved: typeof window === 'undefined' ? 'light' : resolve(current),
      setAppearance: setCurrent,
    }),
    [current],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
