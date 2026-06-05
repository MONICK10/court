'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  speaker: string
  text: string
  timestamp: number
}

interface Props {
  open: boolean
  onClose: () => void
  messages: Message[]
  nameA: string
  nameB: string
}

const SPEAKER_STYLE: Record<string, string> = {
  judge:   'text-accent-gold',
  userA:   'text-blue-400',
  userB:   'text-purple-400',
  lawyerA: 'text-blue-400',
  lawyerB: 'text-purple-400',
}

const SPEAKER_ICON: Record<string, string> = {
  judge:   '⚖️',
  userA:   '🧑',
  userB:   '🧑',
  lawyerA: '🧑',
  lawyerB: '🧑',
}

export default function HistoryDrawer({ open, onClose, messages, nameA, nameB }: Props) {
  const getLabel = (speaker: string) => {
    if (speaker === 'judge') return 'Judge'
    if (speaker === 'userA' || speaker === 'lawyerA') return nameA
    if (speaker === 'userB' || speaker === 'lawyerB') return nameB
    return speaker
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-full z-50 bg-gray-900/95 backdrop-blur-md border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <h2 className="font-bold text-accent-gold text-sm uppercase tracking-wider">
                Case Transcript
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl leading-none transition"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Court has not begun</p>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className={`text-xs font-semibold ${SPEAKER_STYLE[msg.speaker] ?? 'text-gray-400'}`}>
                      {SPEAKER_ICON[msg.speaker] ?? '•'} {getLabel(msg.speaker)}
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed pl-4">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
