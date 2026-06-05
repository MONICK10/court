'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AudienceCommentProps {
  comment: string
  intensity?: 'subtle' | 'moderate' | 'intense'
  visible: boolean
}

export default function AudienceComment({
  comment,
  intensity = 'subtle',
  visible,
}: AudienceCommentProps) {
  const intensityStyles = {
    subtle: 'opacity-60 text-sm',
    moderate: 'opacity-80 text-base',
    intense: 'opacity-100 text-lg font-semibold',
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
          className={`text-center text-gray-400 italic py-2 px-4 border-l-2 border-accent-red/50 ${intensityStyles[intensity]}`}
        >
          💭 {comment}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
