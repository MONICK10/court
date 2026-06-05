'use client'

import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  speaker: string
}

export default function TypingIndicator({ speaker }: TypingIndicatorProps) {
  const isSpeaker = (s: string) => speaker === s

  if (isSpeaker('judge')) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-accent-gold via-amber-600 to-accent-red shadow-lg">
              ⚖️
            </div>
          </div>
          <div className="px-6 py-4 rounded-lg border-2 border-accent-gold/60 bg-gradient-to-r from-accent-gold/10 via-transparent to-transparent backdrop-blur-sm">
            <div className="flex justify-center items-center gap-2">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-accent-gold"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                className="w-2 h-2 rounded-full bg-accent-gold"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full bg-accent-gold"
              />
            </div>
            <p className="text-center text-xs text-accent-gold mt-2 italic">The court is considering...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isSpeaker('lawyerA')) {
    return (
      <div className="flex justify-start">
        <div className="max-w-lg">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-red-900/60 border border-red-600 flex-shrink-0 mt-1">
              👨‍⚖️
            </div>
            <div className="px-5 py-3 rounded-lg bg-red-900/40 border border-red-700/60 backdrop-blur-sm">
              <div className="flex gap-2">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-300"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                  className="w-2 h-2 rounded-full bg-red-300"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-red-300"
                />
              </div>
              <div className="text-xs text-red-400 mt-2 font-semibold">Lawyer A is formulating a response...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSpeaker('lawyerB')) {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg">
          <div className="flex items-start gap-3 flex-row-reverse">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-blue-900/60 border border-blue-600 flex-shrink-0 mt-1">
              👩‍⚖️
            </div>
            <div className="px-5 py-3 rounded-lg bg-blue-900/40 border border-blue-700/60 backdrop-blur-sm">
              <div className="flex gap-2 justify-end">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-blue-300"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                  className="w-2 h-2 rounded-full bg-blue-300"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-blue-300"
                />
              </div>
              <div className="text-xs text-blue-400 mt-2 font-semibold text-right">Lawyer B is analyzing...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
