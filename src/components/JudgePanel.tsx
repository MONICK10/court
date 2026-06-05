/* eslint-disable react/no-unescaped-entities */
'use client'

import { motion } from 'framer-motion'

interface JudgePanelProps {
  message?: string
  isIntensified?: boolean
}

export default function JudgePanel({
  message = 'The court is listening...',
  isIntensified = false,
}: JudgePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center mb-8"
    >
      <div className="w-full max-w-2xl">
        {/* Judge Avatar */}
        <motion.div
          animate={isIntensified ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex justify-center mb-4"
        >
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold transition-all ${
              isIntensified
                ? 'bg-gradient-to-r from-accent-gold to-accent-red shadow-dramatic'
                : 'bg-gradient-to-r from-gray-700 to-gray-900 border-2 border-accent-gold'
            }`}
          >
            ⚖️
          </div>
        </motion.div>

        {/* Judge Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-accent-gold">THE HONOR</h2>
          <p className="text-sm text-gray-400">Judge Dramatic</p>
        </div>

        {/* Judge Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-6 py-4 rounded-lg border-2 border-accent-gold/50 bg-gradient-to-r from-accent-gold/5 to-transparent text-center"
        >
          <p className="text-white italic text-sm leading-relaxed">"{message}"</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
