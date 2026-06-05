/* eslint-disable react/no-unescaped-entities */
'use client'

import { motion } from 'framer-motion'
import { CourtroomMemoryState } from '@/utils/courtroomMemory'
import Link from 'next/link'

interface VerdictRevealProps {
  memory: CourtroomMemoryState
}

export default function VerdictReveal({ memory }: VerdictRevealProps) {
  // Mock verdict generation for now
  const generateMockVerdict = () => {
    const personA = memory.caseSetup.personAName
    const personB = memory.caseSetup.personBName

    const verdicts = [
      {
        winner: 'A' as const,
        message: `After careful consideration of all evidence and emotional testimony, this court finds in favor of ${personA}.`,
        emotional: `${personB}'s pattern of behavior has caused demonstrable harm. This is not acceptable.`,
      },
      {
        winner: 'B' as const,
        message: `While ${personA}'s feelings are valid, context matters. This court finds in favor of ${personB}.`,
        emotional: `Both parties are struggling. This situation requires communication, not judgment.`,
      },
      {
        winner: 'draw' as const,
        message: `This court finds both parties equally responsible for the breakdown.`,
        emotional: `Neither side is innocent. Both failed to communicate, listen, and understand.`,
      },
    ]

    return verdicts[Math.floor(Math.random() * verdicts.length)]
  }

  const verdict = generateMockVerdict()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="w-full max-w-2xl"
      >
        {/* Dramatic Pause */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            ⚖️
          </motion.div>
          <h1 className="text-4xl font-bold text-accent-gold mb-2">VERDICT</h1>
        </motion.div>

        {/* Main Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-b from-accent-gold/20 to-transparent border-2 border-accent-gold rounded-lg p-8 mb-6"
        >
          <p className="text-center text-2xl font-serif text-white mb-4 leading-relaxed">
            "{verdict.message}"
          </p>
          <div className="text-center">
            <span className={`text-lg font-bold px-4 py-2 rounded-full ${
              verdict.winner === 'A' ? 'bg-red-900/60 text-red-200' :
              verdict.winner === 'B' ? 'bg-blue-900/60 text-blue-200' :
              'bg-gray-700/60 text-gray-200'
            }`}>
              {verdict.winner === 'A' ? `Winner: ${memory.caseSetup.personAName}` :
               verdict.winner === 'B' ? `Winner: ${memory.caseSetup.personBName}` :
               'Draw: No Winner'}
            </span>
          </div>
        </motion.div>

        {/* Emotional Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800/60 border border-gray-700 rounded-lg p-6 mb-6"
        >
          <h3 className="text-sm font-bold text-accent-gold mb-3 tracking-widest">COURT'S OBSERVATION</h3>
          <p className="text-gray-200 italic">"{verdict.emotional}"</p>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Case Analysis</p>
            <p className="text-lg font-bold text-accent-gold">{memory.round} Rounds</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Contradictions</p>
            <p className="text-lg font-bold text-accent-red">{memory.contradictions.length} Found</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Messages</p>
            <p className="text-lg font-bold text-accent-gold">{memory.conversationHistory.length}</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">User Statements</p>
            <p className="text-lg font-bold text-accent-gold">
              {memory.userStatements.A.length + memory.userStatements.B.length}
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex gap-4 justify-center"
        >
          <Link href="/setup">
            <button className="px-6 py-3 rounded-lg bg-accent-gold hover:bg-yellow-500 text-black font-bold transition-all">
              New Case
            </button>
          </Link>
          <button
            onClick={() => {
              const verdict_text = `${memory.caseSetup.personAName} vs ${memory.caseSetup.personBName}: ${verdict.message}`
              navigator.clipboard.writeText(verdict_text)
            }}
            className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all"
          >
            Share Verdict
          </button>
        </motion.div>

        {/* Court Closed */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center text-gray-500 text-sm mt-6 font-serif"
        >
          Court Adjourned
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
