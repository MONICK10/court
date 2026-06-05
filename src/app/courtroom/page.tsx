'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useCourtroomStore } from '@/hooks/useCourtroomStore'
import { useSpeech, phaseToAnimState } from '@/hooks/useSpeech'
import CaptionBar from '@/components/CaptionBar'
import HistoryDrawer from '@/components/HistoryDrawer'
import type { AnimState } from '@/components/JudgeScene'
import type { Evidence } from '@/types'

// Three.js is browser-only — skip SSR
const JudgeScene = dynamic(() => import('@/components/JudgeScene'), { ssr: false })

// ─── Login gate ──────────────────────────────────────────────────────
function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username === 'admin' && password === 'volume3') {
      sessionStorage.setItem('solo_auth', '1')
      onSuccess()
    } else {
      setError('Invalid username or password')
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)' }}>
      <motion.div
        animate={shaking ? { x: [-12, 12, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-4"
      >
        {/* Gavel icon */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-2xl font-bold" style={{ color: '#c0a060' }}>Solo Court</h1>
          <p className="text-gray-400 text-sm mt-1">Restricted access — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-xl p-8 space-y-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(192,160,96,0.2)' }}>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(192,160,96,0.3)',
              }}
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(192,160,96,0.3)',
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-sm tracking-wide"
            style={{ background: '#c0a060', color: '#0a0a0f' }}
          >
            Enter Courtroom
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function CourtroomPage() {
  // ── Auth gate — must be first hooks, gate shown before any other render ──
  const [authed, setAuthed] = useState(false)
  useEffect(() => {
    if (sessionStorage.getItem('solo_auth') === '1') setAuthed(true)
  }, [])

  const router = useRouter()
  const {
    caseMemory,
    isLoading,
    error,
    waitingForUserInput,
    nextSpeaker,
    waitingForEvidence,
    initializeCase,
    addUserInput,
    continueAfterEvidence,
    reset,
  } = useCourtroomStore()

  // ── 3D / speech state ──────────────────────────────────────────────────
  const [animState, setAnimState] = useState<AnimState>('idle')
  const [animFlip, setAnimFlip] = useState(false)
  const [currentCaption, setCurrentCaption] = useState('')
  const [captionSpeaker, setCaptionSpeaker] = useState('Judge')
  const [historyOpen, setHistoryOpen] = useState(false)
  const prevHistoryLen = useRef(0)
  const { speak, stop } = useSpeech()

  // ── Input state ────────────────────────────────────────────────────────
  const [userInput, setUserInput] = useState('')
  const [evidenceInput, setEvidenceInput] = useState('')

  // ── Load case ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('caseSetup')
    if (!stored) { router.push('/setup'); return }
    if (!caseMemory) initializeCase(JSON.parse(stored))
  }, [router, caseMemory, initializeCase])

  // ── Detect new judge message → caption + voice + animation ────────────
  useEffect(() => {
    if (!caseMemory) return
    const history = caseMemory.conversationHistory
    if (history.length <= prevHistoryLen.current) return
    prevHistoryLen.current = history.length

    const last = history[history.length - 1]
    if (last.speaker !== 'judge') return

    const phase = caseMemory.currentPhase
    const newAnim = phaseToAnimState(phase, true)
    setAnimFlip(Math.random() > 0.5)
    setAnimState(newAnim)
    setCurrentCaption(last.text)
    setCaptionSpeaker('Judge')

    speak(last.text, {
      onEnd: () => setAnimState('idle'),
      language: caseMemory.language ?? 'english',
    })
  }, [caseMemory?.conversationHistory.length, caseMemory?.currentPhase, speak])

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!userInput.trim() || !nextSpeaker) return
    stop() // cancel judge speech when user replies
    setCurrentCaption('')
    addUserInput(nextSpeaker, userInput)
    setUserInput('')
  }

  const handleSubmitEvidence = () => {
    if (!evidenceInput.trim()) return
    const ev: Evidence = {
      id: `ev-${Date.now()}`,
      uploadedBy: nextSpeaker === 'userA' ? 'personA' : 'personB',
      type: 'text',
      description: evidenceInput.trim(),
      timestamp: Date.now(),
    }
    continueAfterEvidence(ev)
    setEvidenceInput('')
  }

  const handleNewCase = () => {
    stop()
    reset()
    sessionStorage.removeItem('caseSetup')
    router.push('/setup')
  }

  // ── Auth gate render ──────────────────────────────────────────────────
  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />

  // ── Loading / empty state ──────────────────────────────────────────────
  if (!caseMemory) return (
    <div className="w-screen h-screen bg-[#0d0d1a] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">⚖️</div>
        <p className="text-accent-gold text-xl animate-pulse">Court convening...</p>
      </div>
    </div>
  )

  const phaseLabel: Record<string, string> = {
    opening: 'Opening',
    investigation: 'Investigation',
    crossExamination: 'Cross-Examination',
    finalStatements: 'Closing',
    verdict: 'Verdict',
  }

  const inputLabel = () => {
    const name = nextSpeaker === 'userA' ? caseMemory.personA.name : caseMemory.personB.name
    switch (caseMemory.currentPhase) {
      case 'opening':        return `${name}, give your opening statement:`
      case 'investigation':  return `${name}, answer the judge:`
      case 'crossExamination': return `${name}, answer the judge:`
      case 'finalStatements': return `${name}, your closing statement:`
      default: return `${name}:`
    }
  }

  const isVerdictReady = caseMemory.currentPhase === 'verdict' && caseMemory.verdict

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0d0d1a]">

      {/* ── Three.js canvas ── */}
      <div className="absolute inset-0">
        <JudgeScene animState={animState} flip={animFlip} />
      </div>

      {/* ── Subtle vignette at bottom to blend canvas into UI ── */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0d0d1a] to-transparent pointer-events-none" />

      {/* ── Tamil no-voice notice ── */}
      {caseMemory.language === 'tamil' && typeof window !== 'undefined' &&
        !window.speechSynthesis?.getVoices().some(v => v.lang.startsWith('ta')) && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-black/70 border border-yellow-500/40 text-yellow-300 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Tamil voice not installed — captions only · Install via Windows Settings → Language
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-none">
        <div>
          <p className="text-accent-gold font-bold text-sm">{caseMemory.title}</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            {phaseLabel[caseMemory.currentPhase] ?? caseMemory.currentPhase}
            {caseMemory.currentPhase === 'crossExamination' && ` · Round ${caseMemory.crossExamRound}/2`}
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
          title="View transcript"
        >
          ›
        </button>
      </div>

      {/* ── Error notification ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-200 px-4 py-2 rounded-lg z-50 text-sm max-w-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading indicator ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ delay: i * 0.15, duration: 0.7, repeat: Infinity }}
                  className="w-2 h-2 bg-accent-gold rounded-full opacity-80"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom UI (caption + input) ── */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 space-y-3">

        {/* Caption */}
        <CaptionBar text={currentCaption} speaker={captionSpeaker} />

        {/* Verdict panel */}
        <AnimatePresence>
          {isVerdictReady && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/70 backdrop-blur-sm border-2 border-accent-gold rounded-xl p-4 space-y-3 max-w-2xl mx-auto w-full"
            >
              <div className="space-y-1">
                {caseMemory.verdict!.winner === 'personAFavored' ? (
                  <>
                    <p className="font-bold text-green-400">🏆 WINNER: {caseMemory.personA.name}</p>
                    <p className="font-bold text-red-400">❌ LOSER: {caseMemory.personB.name}</p>
                  </>
                ) : caseMemory.verdict!.winner === 'personBFavored' ? (
                  <>
                    <p className="font-bold text-green-400">🏆 WINNER: {caseMemory.personB.name}</p>
                    <p className="font-bold text-red-400">❌ LOSER: {caseMemory.personA.name}</p>
                  </>
                ) : (
                  <p className="font-bold text-accent-gold">⚖️ SHARED RESPONSIBILITY</p>
                )}
              </div>

              {/* Court orders */}
              {caseMemory.verdict!.courtOrders.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-white/10">
                  <p className="text-xs font-semibold text-accent-gold">📋 Court Orders:</p>
                  {caseMemory.verdict!.courtOrders.map(o => (
                    <p key={o.id} className="text-xs text-gray-300">• {o.description}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleNewCase} className="flex-1 bg-accent-red/80 hover:bg-accent-red text-black font-bold py-2 rounded-lg transition text-sm">
                  New Case
                </button>
                <button onClick={() => router.push('/home')} className="flex-1 bg-accent-gold/80 hover:bg-accent-gold text-black font-bold py-2 rounded-lg transition text-sm">
                  History
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evidence panel */}
        <AnimatePresence>
          {waitingForEvidence && !isLoading && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 space-y-2 max-w-2xl mx-auto w-full"
            >
              <p className="text-xs text-accent-gold font-semibold">
                ⚖️ Do you have evidence? (screenshot, message, etc.)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Describe your evidence..."
                  value={evidenceInput}
                  onChange={e => setEvidenceInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && evidenceInput.trim() && handleSubmitEvidence()}
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 px-3 py-2 rounded-lg focus:outline-none focus:border-accent-gold text-sm transition"
                  autoFocus
                />
                <button
                  onClick={handleSubmitEvidence}
                  disabled={!evidenceInput.trim()}
                  className="bg-accent-gold/80 hover:bg-accent-gold disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg transition text-sm"
                >
                  Submit
                </button>
                <button
                  onClick={() => { continueAfterEvidence(); setEvidenceInput('') }}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition text-sm"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <AnimatePresence>
          {waitingForUserInput && nextSpeaker && !waitingForEvidence && !isLoading && !isVerdictReady && (
            <motion.div
              key={`input-${caseMemory.currentPhase}-${nextSpeaker}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 max-w-2xl mx-auto w-full"
            >
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder={inputLabel()}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="flex-1 bg-black/60 backdrop-blur-sm border border-white/20 text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:border-accent-gold transition text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSubmit}
                  disabled={!userInput.trim()}
                  className="bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  Send
                </button>
              </div>
              {/* History toggle */}
              <button
                onClick={() => setHistoryOpen(true)}
                className="w-12 h-12 bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xl hover:bg-white/10 transition flex items-center justify-center"
                title="View transcript"
              >
                ›
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── History drawer ── */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        messages={caseMemory.conversationHistory}
        nameA={caseMemory.personA.name}
        nameB={caseMemory.personB.name}
      />

    </div>
  )
}
