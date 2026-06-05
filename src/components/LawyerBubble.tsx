'use client'

import { motion } from 'framer-motion'
import TypingAnimation from './TypingAnimation'

interface LawyerBubbleProps {
  name: string
  message: string
  isTyping?: boolean
  isLeft?: boolean
  onTypingComplete?: () => void
}

export default function LawyerBubble({
  name,
  message,
  isTyping = false,
  isLeft = true,
  onTypingComplete,
}: LawyerBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex ${isLeft ? 'justify-start' : 'justify-end'} mb-6`}
    >
      <div className={`max-w-xs ${isLeft ? 'lg:max-w-md' : 'lg:max-w-md'}`}>
        <div className="text-sm font-semibold mb-2 px-2">
          {isLeft ? (
            <span className="text-accent-gold">{name}</span>
          ) : (
            <span className="text-accent-red text-right block">{name}</span>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`px-4 py-3 rounded-lg backdrop-blur-sm border ${
            isLeft
              ? 'bg-gradient-to-r from-accent-gold/10 to-transparent border-accent-gold/30 text-white'
              : 'bg-gradient-to-l from-accent-red/10 to-transparent border-accent-red/30 text-white'
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">
                <TypingAnimation text={message} speed={25} onComplete={onTypingComplete} />
              </span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{message}</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
