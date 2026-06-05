'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import CourtroomLayout from '@/components/CourtroomLayout'
import { useUIStore, THEME_CONFIG } from '@/hooks/useUIStore'
import type { CourtMood } from '@/types'

const MOODS = [
  { id: 'serious', label: 'Serious', desc: 'Professional and measured' },
  { id: 'savage', label: 'Savage', desc: 'Brutally direct' },
  { id: 'drama', label: 'Drama', desc: 'Cinematic and theatrical' },
  { id: 'funny', label: 'Funny', desc: 'Witty and sharp' },
]

export default function FilePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const setStoreMood = useUIStore(s => s.setMood)

  const [myPerson, setMyPerson] = useState<'A' | 'B' | null>(null)
  const [myName, setMyName] = useState('')
  const [statement, setStatement] = useState('')
  const [mood, setMood] = useState<CourtMood>('serious')
  const [language, setLanguage] = useState<'english' | 'tamil'>('english')
  const [submitted, setSubmitted] = useState(false)
  const [otherSubmitted, setOtherSubmitted] = useState(false)
  const [error, setError] = useState('')

  const poll = useCallback(async () => {
    const res = await fetch(`/api/room/status?code=${code}`)
    if (!res.ok) return
    const data = await res.json()

    const other = myPerson === 'A' ? data.personB : data.personA
    setOtherSubmitted(!!(other?.statement || data.status === 'in_court'))

    if (data.status === 'in_court') {
      router.push(`/room/${code}/courtroom`)
    }
  }, [code, myPerson, router])

  useEffect(() => {
    const person = sessionStorage.getItem('roomPerson') as 'A' | 'B'
    const name = sessionStorage.getItem('roomPersonName') ?? ''
    setMyPerson(person)
    setMyName(name)
  }, [])

  useEffect(() => {
    if (!myPerson) return
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [myPerson, poll])

  const handleSubmit = async () => {
    if (!statement.trim() || !myPerson) return
    setError('')
    const res = await fetch('/api/room/statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, person: myPerson, statement: statement.trim(), mood: myPerson === 'A' ? mood : undefined, language: myPerson === 'A' ? language : undefined }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to submit')
      return
    }
    setSubmitted(true)
    poll()
  }

  return (
    <CourtroomLayout>
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 max-w-xl mx-auto py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-4xl mb-3">📜</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>File Your Statement</h1>
          <p className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: 'var(--theme-accent)', opacity: 0.6 }}>
            {THEME_CONFIG[mood].judgeLabel}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {myName ? `${myName}, ` : ''}state your side of the case clearly
          </p>
        </motion.div>

        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-accent-gold mb-2">Your statement</label>
              <textarea
                placeholder="Explain your side of the situation. Be specific — the judge will use your exact words."
                value={statement}
                onChange={e => setStatement(e.target.value)}
                rows={5}
                className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-3 rounded-lg focus:outline-none transition resize-none text-sm"
              />
            </div>

            {/* Mood — only Person A picks */}
            {myPerson === 'A' && (
              <div>
                <label className="block text-sm font-semibold text-accent-gold mb-2">Court mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOODS.map(m => {
                    const theme = THEME_CONFIG[m.id as CourtMood]
                    const isActive = mood === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => { setMood(m.id as CourtMood); setStoreMood(m.id as CourtMood) }}
                        className="px-3 py-2 rounded-lg border text-left transition-all"
                        style={isActive ? {
                          borderColor: theme.accent,
                          backgroundColor: `rgba(var(--theme-glow-rgb), 0.12)`,
                          color: '#fff',
                        } : {
                          borderColor: '#4b5563',
                          backgroundColor: 'rgba(31,41,55,0.5)',
                          color: '#9ca3af',
                        }}
                      >
                        <span className="font-semibold text-sm block" style={isActive ? { color: theme.accent } : {}}>
                          {m.label}
                        </span>
                        <span className="text-xs opacity-70">{m.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Language — only Person A picks */}
            {myPerson === 'A' && (
              <div>
                <label className="block text-sm font-semibold text-accent-gold mb-2">Court language</label>
                <div className="flex gap-2">
                  {([
                    { value: 'english', label: 'English' },
                    { value: 'tamil',   label: 'தமிழ் Tamil' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLanguage(opt.value)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                        language === opt.value
                          ? 'border-accent-gold bg-accent-gold/10 text-white'
                          : 'border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!statement.trim()}
              className="w-full bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
            >
              Submit Statement
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <p className="text-green-400 font-bold text-lg">✓ Statement submitted</p>
            {!otherSubmitted ? (
              <p className="text-gray-400 text-sm animate-pulse">Waiting for the other person to file their statement...</p>
            ) : (
              <p className="text-accent-gold animate-pulse">Both filed — opening court...</p>
            )}
          </motion.div>
        )}
      </div>
    </CourtroomLayout>
  )
}
