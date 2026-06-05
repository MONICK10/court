'use client'

import { motion } from 'framer-motion'

interface ObjectionPopupProps {
  message?: string
}

export default function ObjectionPopup({ message = 'OBJECTION!' }: ObjectionPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.3, rotate: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <div className="relative">
        {/* Shockwave effect */}
        <motion.div
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 border-4 border-accent-red rounded-full"
          style={{ width: '200px', height: '200px', left: '-100px', top: '-100px' }}
        />

        {/* Outer glow */}
        <motion.div
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 blur-2xl bg-accent-red/40 rounded-full"
          style={{ width: '250px', height: '250px', left: '-125px', top: '-125px' }}
        />

        {/* Main text */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.4 }}
          className="relative text-center"
        >
          <div
            className="text-7xl font-black text-accent-red drop-shadow-2xl"
            style={{
              textShadow: '0 0 40px rgba(230, 57, 70, 0.9), 0 0 80px rgba(230, 57, 70, 0.5)',
              letterSpacing: '0.1em',
            }}
          >
            {message}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
