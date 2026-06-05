'use client'

import { motion } from 'framer-motion'

interface TypingAnimationProps {
  text: string
  speed?: number
  onComplete?: () => void
}

export default function TypingAnimation({
  text,
  speed = 30,
  onComplete,
}: TypingAnimationProps) {
  const letters = text.split('')

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: speed / 1000, delayChildren: 0.04 * i },
    }),
  }

  const child = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      onAnimationComplete={onComplete}
    >
      {letters.map((letter, index) => (
        <motion.span key={index} variants={child}>
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.div>
  )
}
