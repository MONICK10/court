'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUIStore, THEME_CONFIG } from '@/hooks/useUIStore'

const PHASE_ANNOUNCE: Record<string, { title: string; duration: number }> = {
  opening: { title: 'COURT IS NOW IN SESSION', duration: 2200 },
  investigation: { title: 'INVESTIGATION BEGINS', duration: 2200 },
  crossExamination: { title: 'CROSS EXAMINATION', duration: 2200 },
  finalStatements: { title: 'CLOSING STATEMENTS', duration: 2200 },
  verdict: { title: 'THE VERDICT', duration: 3000 },
}

interface PhaseTransitionProps {
  phase: string
  subtitle?: string
  onDone: () => void
}

export default function PhaseTransition({ phase, subtitle, onDone }: PhaseTransitionProps) {
  const mood = useUIStore(s => s.mood)
  const theme = THEME_CONFIG[mood]
  const announce = PHASE_ANNOUNCE[phase]

  useEffect(() => {
    if (!announce) { onDone(); return }
    const t = setTimeout(onDone, announce.duration)
    return () => clearTimeout(t)
  }, [announce, onDone])

  if (!announce) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: theme.bg + 'f0' }}
    >
      {/* Top line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="w-48 md:w-72 h-px mb-8 origin-left"
        style={{ backgroundColor: theme.accent }}
      />

      {/* Main text */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-3xl md:text-6xl font-black tracking-widest uppercase text-center px-6"
        style={{
          color: theme.accent,
          textShadow: `0 0 60px ${theme.accent}55, 0 0 120px ${theme.accent}22`,
          letterSpacing: '0.15em',
        }}
      >
        {announce.title}
      </motion.h1>

      {/* Bottom line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        className="w-48 md:w-72 h-px mt-8 origin-right"
        style={{ backgroundColor: theme.accent }}
      />

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="text-xs md:text-sm text-gray-400 mt-6 text-center px-6 max-w-sm tracking-wide"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Subtle pulse ring behind text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.08, 0], scale: [0.5, 1.4, 1.4] }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          border: `2px solid ${theme.accent}`,
        }}
      />
    </motion.div>
  )
}
