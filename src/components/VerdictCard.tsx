/* eslint-disable react/no-unescaped-entities */
'use client'

import { motion } from 'framer-motion'
import { Verdict } from '@/types'
import Link from 'next/link'

interface VerdictCardProps {
  verdict: Verdict
  caseTitle: string
}

export default function VerdictCard({
  verdict,
  caseTitle,
}: VerdictCardProps) {
  const getWinnerEmoji = () => {
    if (verdict.winner === 'draw') return '⚖️'
    return verdict.winner === 'A' ? '👑' : '👑'
  }

  const getColorClass = () => {
    if (verdict.winner === 'A') return 'from-accent-gold/20 to-transparent border-accent-gold/50'
    if (verdict.winner === 'B') return 'from-accent-red/20 to-transparent border-accent-red/50'
    return 'from-accent-gold/10 via-accent-red/10 to-transparent border-gray-500/50'
  }

  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-green-400'
    if (score > 50) return 'text-yellow-400'
    return 'text-accent-red'
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-2xl mx-auto"
    >
      {/* Main Verdict Card */}
      <motion.div
        variants={itemVariants}
        className={`bg-gradient-to-r ${getColorClass()} border-2 rounded-xl p-8 backdrop-blur-sm`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: 'linear' }}
            className="text-5xl mb-4 flex justify-center"
          >
            {getWinnerEmoji()}
          </motion.div>
          <h1 className="text-3xl font-bold text-accent-gold mb-2">VERDICT</h1>
          <p className="text-sm text-gray-300 italic">"{caseTitle}"</p>
        </div>

        {/* Verdict Statement */}
        <motion.div variants={itemVariants} className="mb-8 p-6 bg-black/30 rounded-lg border border-white/10">
          <p className="text-lg text-white font-semibold text-center leading-relaxed">
            {verdict.verdict}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {/* Confidence */}
          <div className="bg-black/30 p-4 rounded-lg border border-accent-gold/30 text-center">
            <p className="text-accent-gold text-xs font-semibold mb-2">CONFIDENCE</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              {Math.round(verdict.winnerConfidence)}%
            </motion.p>
          </div>

          {/* Toxicity */}
          <div className="bg-black/30 p-4 rounded-lg border border-accent-red/30 text-center">
            <p className="text-accent-red text-xs font-semibold mb-2">TOXICITY</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className={`text-3xl font-bold ${getScoreColor(verdict.toxicityScore)}`}
            >
              {Math.round(verdict.toxicityScore)}%
            </motion.p>
          </div>

          {/* Communication */}
          <div className="bg-black/30 p-4 rounded-lg border border-blue-500/30 text-center">
            <p className="text-blue-400 text-xs font-semibold mb-2">COMMUNICATION</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className={`text-3xl font-bold ${getScoreColor(verdict.communicationScore)}`}
            >
              {Math.round(verdict.communicationScore)}%
            </motion.p>
          </div>

          {/* Compatibility */}
          <div className="bg-black/30 p-4 rounded-lg border border-purple-500/30 text-center">
            <p className="text-purple-400 text-xs font-semibold mb-2">COMPATIBILITY</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className={`text-3xl font-bold ${getScoreColor(verdict.emotionalCompatibility)}`}
            >
              {Math.round(verdict.emotionalCompatibility)}%
            </motion.p>
          </div>
        </motion.div>

        {/* Survival Chance */}
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-accent-gold text-sm font-semibold mb-3">RELATIONSHIP SURVIVAL CHANCE</p>
          <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${verdict.survivalChance}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-full ${
                verdict.survivalChance > 70
                  ? 'bg-green-500/70'
                  : verdict.survivalChance > 40
                  ? 'bg-yellow-500/70'
                  : 'bg-accent-red/70'
              }`}
            />
          </div>
          <p className="text-white text-lg font-bold mt-2">{verdict.survivalChance}%</p>
        </motion.div>

        {/* Red Flags */}
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-accent-red text-sm font-semibold mb-3">RED FLAGS DETECTED</p>
          <div className="space-y-2">
            {verdict.redFlags.map((flag, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-2 text-sm text-gray-300"
              >
                <span className="text-accent-red">⚠️</span>
                <span>{flag}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Emotional Summary */}
        {verdict.emotionalSummary && (
          <motion.div variants={itemVariants} className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30 mb-6">
            <p className="text-xs text-blue-400 font-semibold mb-2">💭 EMOTIONAL REALITY</p>
            <p className="text-sm text-gray-200">{verdict.emotionalSummary}</p>
          </motion.div>
        )}

        {/* Strengths Recognized */}
        {verdict.strengthsRecognized && verdict.strengthsRecognized.length > 0 && (
          <motion.div variants={itemVariants} className="p-4 bg-green-500/10 rounded-lg border border-green-400/30 mb-6">
            <p className="text-xs text-green-400 font-semibold mb-3">✨ STRENGTHS RECOGNIZED</p>
            <div className="space-y-2">
              {verdict.strengthsRecognized.map((strength, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-sm text-gray-300"
                >
                  • {strength}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Funniest Observation */}
        {verdict.funniest && (
          <motion.div
            variants={itemVariants}
            className="p-4 bg-gradient-to-r from-accent-gold/10 to-accent-red/10 rounded-lg border border-yellow-500/30 mb-6"
          >
            <p className="text-xs text-yellow-400 font-semibold mb-2">😂 FUNNIEST OBSERVATION</p>
            <p className="text-sm text-gray-200 italic">"{verdict.funniest}"</p>
          </motion.div>
        )}

        {/* Recommendation */}
        {verdict.recommendation && (
          <motion.div variants={itemVariants} className="p-4 bg-purple-500/10 rounded-lg border border-purple-400/30 mb-6">
            <p className="text-xs text-purple-400 font-semibold mb-2">💡 COURT'S RECOMMENDATION</p>
            <p className="text-sm text-gray-200">{verdict.recommendation}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4">
          <button
            onClick={() => {
              const text = `⚖️ AI RELATIONSHIP COURT VERDICT\n\n"${caseTitle}"\n\n${verdict.verdict}\n\nSurvival Chance: ${Math.round(verdict.survivalChance)}%\nToxicity: ${Math.round(verdict.toxicityScore)}%\n\n${verdict.funniest}`
              navigator.clipboard.writeText(text).then(() => {
                alert('Verdict copied to clipboard!')
              })
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-gold to-accent-red text-black font-bold rounded-lg hover:shadow-glow-gold transition-all"
          >
            📋 Copy Verdict
          </button>
          <button
            onClick={() => {
              const text = `Check out my AI Relationship Court verdict! 🏛️\n\n"${caseTitle}"\n\nSurvival Chance: ${Math.round(verdict.survivalChance)}%\nToxicity Level: ${Math.round(verdict.toxicityScore)}%\n\n${verdict.funniest}\n\nWhat's your verdict?`
              navigator.clipboard.writeText(text)
              alert('Share text copied to clipboard!')
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-red to-accent-gold text-black font-bold rounded-lg hover:shadow-glow-red transition-all"
          >
            🔗 Share
          </button>
        </motion.div>

        {/* Back Button */}
        <motion.div variants={itemVariants} className="mt-6">
          <Link href="/">
            <button className="w-full px-6 py-3 border-2 border-accent-gold/50 text-accent-gold font-semibold rounded-lg hover:bg-accent-gold/10 transition-all">
              ← Start New Case
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
