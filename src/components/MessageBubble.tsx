/* eslint-disable react/no-unescaped-entities */
'use client'

import { motion } from 'framer-motion'
import { forwardRef } from 'react'
import { CourtroomMessage } from '@/hooks/useCourtroomStore'
import TypingIndicator from './TypingIndicator'

interface MessageBubbleProps {
  message: CourtroomMessage
}

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(function MessageBubble({ message }, ref) {
  const isSpeaker = (speaker: string) => message.speaker === speaker
  const isUser = message.speaker.startsWith('user')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {isSpeaker('judge') && (
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-2xl">
            <motion.div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-accent-gold via-amber-600 to-accent-red shadow-lg">
                ⚖️
              </div>
            </motion.div>
            <motion.div
              className="px-6 py-4 rounded-lg border-2 border-accent-gold/60 bg-gradient-to-r from-accent-gold/10 via-transparent to-transparent backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-center text-white font-serif text-base leading-relaxed italic">
                "{message.message}"
              </p>
              <div className="text-center mt-2 text-xs text-accent-gold font-bold tracking-widest">
                THE COURT
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {isSpeaker('lawyerA') && (
        <div className="flex justify-start mb-4">
          <div className="max-w-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-red-900/60 border border-red-600 flex-shrink-0 mt-1">
                👨‍⚖️
              </div>
              <motion.div
                className="px-5 py-3 rounded-lg bg-red-900/40 border border-red-700/60 backdrop-blur-sm hover:bg-red-900/50 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <p className="text-red-100 text-sm leading-relaxed">
                  {message.message}
                </p>
                <div className="text-xs text-red-400 mt-2 font-semibold">Lawyer A</div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {isSpeaker('lawyerB') && (
        <div className="flex justify-end mb-4">
          <div className="max-w-lg">
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-blue-900/60 border border-blue-600 flex-shrink-0 mt-1">
                👩‍⚖️
              </div>
              <motion.div
                className="px-5 py-3 rounded-lg bg-blue-900/40 border border-blue-700/60 backdrop-blur-sm hover:bg-blue-900/50 transition-all text-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <p className="text-blue-100 text-sm leading-relaxed">
                  {message.message}
                </p>
                <div className="text-xs text-blue-400 mt-2 font-semibold">Lawyer B</div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {message.speaker === 'userA' && (
        <div className="flex justify-start mb-4">
          <motion.div
            className="max-w-lg px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-sm text-gray-200 italic">"{message.message}"</p>
            <div className="text-xs text-gray-500 mt-2">Your statement</div>
          </motion.div>
        </div>
      )}

      {message.speaker === 'userB' && (
        <div className="flex justify-end mb-4">
          <motion.div
            className="max-w-lg px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 backdrop-blur-sm text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-sm text-gray-200 italic">"{message.message}"</p>
            <div className="text-xs text-gray-500 mt-2">Your statement</div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
})

export default MessageBubble
