'use client'

import { motion } from 'framer-motion'

interface AudienceReactionProps {
  message: string
}

export default function AudienceReaction({ message }: AudienceReactionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: -50 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="fixed left-8 top-32 z-40"
    >
      <div className="bg-gray-800/90 border border-gray-700 rounded-lg px-4 py-3 max-w-xs shadow-lg hover:border-accent-gold/50 transition-all">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <p className="text-sm text-gray-300 italic">"{message}"</p>
        </div>
        <div className="text-xs text-gray-500 mt-2">Audience</div>
      </div>
    </motion.div>
  )
}
