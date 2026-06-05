'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  text: string
  speaker?: string
}

export default function CaptionBar({ text, speaker }: Props) {
  if (!text) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text.slice(0, 40)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-auto"
      >
        {speaker && (
          <p className="text-xs font-semibold text-accent-gold/70 mb-1 text-center tracking-widest uppercase">
            {speaker}
          </p>
        )}
        <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-4 text-center">
          <p className="text-white text-base md:text-lg leading-relaxed font-light">
            {text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
