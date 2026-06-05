'use client'

import { useEffect } from 'react'
import { useUIStore, THEME_CONFIG } from '@/hooks/useUIStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mood = useUIStore(s => s.mood)

  useEffect(() => {
    const t = THEME_CONFIG[mood]
    const root = document.documentElement
    root.style.setProperty('--theme-bg', t.bg)
    root.style.setProperty('--theme-accent', t.accent)
    root.style.setProperty('--theme-glow-rgb', t.glowRgb)
    root.style.setProperty('--theme-scroll-thumb', t.scrollThumb)
  }, [mood])

  return <>{children}</>
}
