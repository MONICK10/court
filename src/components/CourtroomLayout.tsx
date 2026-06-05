'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/hooks/useUIStore'
import { setMuted, unlockAudio } from '@/utils/soundService'

interface CourtroomLayoutProps {
  children: ReactNode
}

export default function CourtroomLayout({ children }: CourtroomLayoutProps) {
  const { isMuted, toggleMute } = useUIStore()

  const handleMuteToggle = () => {
    const next = !isMuted
    toggleMute()
    setMuted(next)
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: 'var(--theme-bg)', transition: 'background-color 0.5s ease' }}
      onClick={unlockAudio}   /* first click anywhere unlocks browser audio */
    >
      {/* Animated background glows — theme-coloured */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(var(--theme-glow-rgb), 0.18) 0%, transparent 70%)` }}
        />
        <motion.div
          animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(var(--theme-glow-rgb), 0.12) 0%, transparent 70%)` }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(var(--theme-glow-rgb), 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--theme-glow-rgb), 0.15) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Mute toggle — fixed top-right */}
      <button
        onClick={handleMuteToggle}
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        className="fixed top-4 right-4 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all text-base"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
