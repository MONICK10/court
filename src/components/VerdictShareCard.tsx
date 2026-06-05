'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { THEME_CONFIG } from '@/hooks/useUIStore'
import type { CourtMood } from '@/types'

interface VerdictShareCardProps {
  caseTitle: string
  winnerName: string
  loserName: string
  winner: string           // 'A' | 'B' | 'shared'
  verdictOneLiner: string  // short one-line verdict text
  mood: CourtMood
  personAName: string
  personBName: string
  caseDate?: number
}

export default function VerdictShareCard({
  caseTitle,
  winnerName,
  loserName,
  winner,
  verdictOneLiner,
  mood,
  caseDate,
}: VerdictShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const theme = THEME_CONFIG[mood]

  const formattedDate = new Date(caseDate ?? Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const downloadCard = useCallback(async () => {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: theme.bg,
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `verdict-${caseTitle.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Download failed', e)
    } finally {
      setDownloading(false)
    }
  }, [cardRef, downloading, theme.bg, caseTitle])

  const whatsappText = encodeURIComponent(
    `⚖ AI COURT VERDICT\n\nCase: ${caseTitle}\n🏆 Winner: ${winnerName}\n❌ Loser: ${loserName}\n\n"${verdictOneLiner}"\n\nTry AI Court → https://your-app-url.com`
  )

  const twitterText = encodeURIComponent(
    `⚖ AI just judged our fight!\n🏆 Winner: ${winnerName}\n❌ Loser: ${loserName}\n\nCase: "${caseTitle}"\n\n#AIcourt #RelationshipCourt`
  )

  const isShared = winner === 'shared'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      {/* ─── Downloadable card ─── */}
      <div
        ref={cardRef}
        className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.bg,
          border: `2px solid ${theme.accent}`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '32px 28px',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span style={{ fontSize: '28px' }}>⚖</span>
          <div>
            <p style={{ color: theme.accent, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              AI RELATIONSHIP COURT
            </p>
            <p style={{ color: theme.accent, fontSize: '8px', opacity: 0.6, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>
              {THEME_CONFIG[mood].judgeLabel}
            </p>
          </div>
        </div>

        {/* Top accent line */}
        <div style={{ height: '2px', backgroundColor: theme.accent, marginBottom: '20px', borderRadius: '1px' }} />

        {/* Case name */}
        <p style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CASE</p>
        <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '20px', lineHeight: 1.3 }}>
          {caseTitle}
        </p>

        {/* Verdict one-liner */}
        <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px', fontStyle: 'italic' }}>
          &ldquo;{verdictOneLiner}&rdquo;
        </p>

        {/* Bottom accent line */}
        <div style={{ height: '1px', backgroundColor: theme.accent, opacity: 0.3, marginBottom: '16px' }} />

        {/* Winner / Loser */}
        {isShared ? (
          <p style={{ color: theme.accent, fontSize: '14px', fontWeight: 700, textAlign: 'center', marginBottom: '16px' }}>
            ⚖ SHARED RESPONSIBILITY
          </p>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>🏆 WINNER: {winnerName}</p>
            <p style={{ color: '#f87171', fontSize: '13px', fontWeight: 700 }}>❌ LOSER: {loserName}</p>
          </div>
        )}

        {/* Bottom line */}
        <div style={{ height: '1px', backgroundColor: theme.accent, opacity: 0.3, marginBottom: '12px' }} />

        {/* Watermark */}
        <p style={{ color: '#6b7280', fontSize: '10px', textAlign: 'center' }}>
          Judged by AI Court · {formattedDate}
        </p>
      </div>

      {/* ─── Action buttons ─── */}
      <div className="flex flex-col gap-2 max-w-sm mx-auto">
        {/* Download */}
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="w-full font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60"
          style={{ backgroundColor: theme.accent, color: theme.bg === '#0a0f00' ? '#000' : '#000' }}
        >
          {downloading ? 'Preparing image...' : '⬇ Download Image'}
        </button>

        {/* WhatsApp */}
        <button
          onClick={() => window.open(`https://wa.me/?text=${whatsappText}`, '_blank')}
          className="w-full font-bold py-3 rounded-xl text-sm text-white transition-all"
          style={{ backgroundColor: '#25d366' }}
        >
          📲 Share on WhatsApp
        </button>

        {/* Instagram — save then post */}
        <button
          onClick={downloadCard}
          className="w-full font-bold py-3 rounded-xl text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
        >
          📸 Save for Instagram Story
        </button>
        <p className="text-center text-xs text-gray-500">↑ Saves image → open Instagram → post to story</p>

        {/* Twitter */}
        <button
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank')}
          className="w-full font-bold py-3 rounded-xl text-sm text-white transition-all bg-black border border-white/20"
        >
          𝕏 Share on Twitter/X
        </button>
      </div>
    </motion.div>
  )
}
