'use client'

import { motion } from 'framer-motion'
import { courtroomPhases } from '@/utils/courtroomFlow'

interface CourtroomPhaseIndicatorProps {
  currentPhase: 'intro' | 'opening' | 'crossExam' | 'emotional' | 'closing' | 'verdict'
}

export default function CourtroomPhaseIndicator({
  currentPhase,
}: CourtroomPhaseIndicatorProps) {
  const phases = Object.values(courtroomPhases)
  const currentIndex = phases.findIndex(p => p.phase === currentPhase)

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Phase Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-3xl font-bold text-accent-gold mb-2">
          {courtroomPhases[currentPhase]?.title || 'Courtroom'}
        </h2>
        <p className="text-gray-400 text-sm">
          {courtroomPhases[currentPhase]?.description}
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {phases.map((phase, index) => (
          <motion.div
            key={phase.phase}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`flex-1 h-1 rounded-full origin-left transition-all ${
              index <= currentIndex
                ? 'bg-gradient-to-r from-accent-gold to-accent-red'
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Phase labels */}
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        {phases.map((phase) => (
          <div key={phase.phase} className="text-center flex-1">
            <motion.span
              animate={
                phase.phase === currentPhase
                  ? { color: '#f77f00', fontWeight: 600 }
                  : { color: '#9ca3af' }
              }
            >
              {phase.title.split(' ')[0]}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  )
}
