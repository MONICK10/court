'use client'

import { motion } from 'framer-motion'

interface CourtProgressProps {
  currentPhase: string
  round: number
}

export default function CourtProgress({ currentPhase, round }: CourtProgressProps) {
  const phases = [
    { id: 'opening_statements', label: 'Opening', icon: '📋' },
    { id: 'lawyer_reframing', label: 'Reframing', icon: '🔄' },
    { id: 'cross_examination', label: 'Cross Exam', icon: '⚡' },
    { id: 'emotional_clarification', label: 'Emotional', icon: '💔' },
    { id: 'final_arguments', label: 'Closing', icon: '🎬' },
    { id: 'verdict', label: 'Verdict', icon: '⚖️' },
  ]

  const currentIndex = phases.findIndex(p => p.id === currentPhase)

  return (
    <div className="w-full">
      {/* Phase Indicator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {phases.map((phase, idx) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex-shrink-0 flex items-center"
          >
            <motion.div
              className={`relative w-16 h-16 rounded-full flex flex-col items-center justify-center text-2xl font-bold transition-all cursor-pointer ${
                idx < currentIndex
                  ? 'bg-gradient-to-br from-green-600 to-green-900 border-2 border-green-400 shadow-lg shadow-green-500/50'
                  : idx === currentIndex
                  ? 'bg-gradient-to-br from-accent-gold via-amber-600 to-accent-red border-2 border-accent-gold shadow-lg shadow-accent-gold/50 scale-110'
                  : 'bg-gray-700 border-2 border-gray-600'
              }`}
              animate={idx === currentIndex ? { scale: [1, 1.05, 1] } : {}}
              transition={
                idx === currentIndex
                  ? { duration: 2, repeat: Infinity }
                  : undefined
              }
            >
              {phase.icon}
              {idx < currentIndex && (
                <div className="absolute inset-0 flex items-center justify-center text-xl">✓</div>
              )}
            </motion.div>

            {/* Connector Line */}
            {idx < phases.length - 1 && (
              <motion.div
                className={`w-8 h-1 mx-1 ${
                  idx < currentIndex
                    ? 'bg-green-500 shadow-md shadow-green-500/50'
                    : 'bg-gray-600'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: idx * 0.15 + 0.2 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Current Phase Label */}
      <motion.div
        className="text-center"
        key={currentPhase}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-accent-gold mb-1">
          {phases[currentIndex]?.label}
        </h2>
        <p className="text-sm text-gray-400">
          Round {round} • {currentPhase.replace(/_/g, ' ')}
        </p>
      </motion.div>
    </div>
  )
}
