'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import PhaseTransition from '@/components/PhaseTransition'
import ObjectionPopup from '@/components/ObjectionPopup'
import VerdictShareCard from '@/components/VerdictShareCard'
import CaptionBar from '@/components/CaptionBar'
import HistoryDrawer from '@/components/HistoryDrawer'
import { useUIStore } from '@/hooks/useUIStore'
import { useSpeech, phaseToAnimState } from '@/hooks/useSpeech'
import { playSound, startAmbience, stopAmbience, stopTyping, startTyping, setMuted, unlockAudio } from '@/utils/soundService'
import type { CourtMood } from '@/types'
import type { AnimState } from '@/components/JudgeScene'

// Three.js is browser-only — skip SSR
const JudgeScene = dynamic(() => import('@/components/JudgeScene'), { ssr: false })

interface Message { speaker: string; text: string; timestamp: number }

interface CourtOrder {
  id: string
  description: string
  assignedTo: 'A' | 'B' | 'both'
  assignedName: string
  completed: boolean
}

interface CourtroomState {
  conversationHistory: Message[]
  currentPhase: string
  waitingFor: 'A' | 'B' | null
  waitingForEvidence: boolean
  evidenceRequester: 'A' | 'B' | null
  crossExamRound: number
  isProcessing: boolean
  verdict: { text: string; winner: string; winnerName: string; loserName: string } | null
  courtOrders: CourtOrder[]
  lastUpdated: number
  personAName: string
  personBName: string
  courtName: string
  mood: string
  language?: string
  initializing?: boolean
}

const PHASE_LABELS: Record<string, string> = {
  opening: 'Opening',
  investigation: 'Investigation',
  crossExamination: 'Cross-Examination',
  finalStatements: 'Closing Statements',
  verdict: 'Verdict',
}

export default function RoomCourtroomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const { setMood: setStoreMood, objectionsA, objectionsB, isMuted, toggleMute } = useUIStore()

  const [myPerson, setMyPerson] = useState<'A' | 'B' | null>(null)
  const [state, setState] = useState<CourtroomState | null>(null)
  const [userInput, setUserInput] = useState('')
  const [evidenceInput, setEvidenceInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transitionPhase, setTransitionPhase] = useState<string | null>(null)
  const [showObjection, setShowObjection] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Judge scene state
  const [animState, setAnimState] = useState<AnimState>('idle')
  const [animFlip, setAnimFlip] = useState(false)
  const [currentCaption, setCurrentCaption] = useState('')

  const lastUpdated = useRef(0)
  const prevPhase = useRef<string | null>(null)
  const prevHistoryLen = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { speak, stop } = useSpeech()

  // Sync room mood → theme store
  useEffect(() => {
    if (state?.mood) setStoreMood(state.mood as CourtMood)
  }, [state?.mood, setStoreMood])

  // Show cinematic phase transition + play sounds when phase changes
  useEffect(() => {
    if (!state?.currentPhase) return
    if (prevPhase.current !== null && prevPhase.current !== state.currentPhase) {
      setTransitionPhase(state.currentPhase)
      playSound('gavel')
      if (state.currentPhase === 'verdict') playSound('tension')
    }
    prevPhase.current = state.currentPhase
  }, [state?.currentPhase])

  // Start ambience when courtroom loads
  useEffect(() => {
    if (state && !state.initializing) startAmbience()
    return () => stopAmbience()
  }, [state?.initializing])

  // Typing sound while judge is processing
  useEffect(() => {
    if (state?.isProcessing || submitting) startTyping()
    else stopTyping()
  }, [state?.isProcessing, submitting])

  // Winner reveal sound
  const verdictShownRef = useRef(false)
  useEffect(() => {
    if (state?.verdict && !verdictShownRef.current) {
      verdictShownRef.current = true
      playSound('winner')
    }
  }, [state?.verdict])

  // Detect new judge messages → animate + caption + voice
  useEffect(() => {
    if (!state?.conversationHistory) return
    const history = state.conversationHistory
    if (history.length <= prevHistoryLen.current) return
    prevHistoryLen.current = history.length

    const last = history[history.length - 1]
    if (last.speaker !== 'judge') return

    const newAnim = phaseToAnimState(state.currentPhase, true)
    setAnimFlip(Math.random() > 0.5)
    setAnimState(newAnim)
    setCurrentCaption(last.text)

    speak(last.text, {
      onEnd: () => setAnimState('idle'),
      language: state.language ?? 'english',
    })
  }, [state?.conversationHistory?.length, state?.currentPhase, speak])

  useEffect(() => {
    const person = sessionStorage.getItem('roomPerson') as 'A' | 'B'
    setMyPerson(person)
  }, [])

  const poll = useCallback(async () => {
    const res = await fetch(`/api/room/courtroom?code=${code}`)
    if (!res.ok) return
    const data: CourtroomState = await res.json()
    if (data.lastUpdated !== lastUpdated.current) {
      lastUpdated.current = data.lastUpdated
      setState(data)
    }
  }, [code])

  useEffect(() => {
    if (!myPerson) return
    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [myPerson, poll])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state?.conversationHistory.length])

  const submitInput = async () => {
    if (!userInput.trim() || !myPerson || submitting) return
    stop()
    setCurrentCaption('')
    setSubmitting(true)
    await fetch('/api/room/courtroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, person: myPerson, action: 'submit_input', text: userInput.trim() }),
    })
    setUserInput('')
    setSubmitting(false)
    poll()
  }

  const markTaskDone = async (taskId: string) => {
    await fetch('/api/room/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, person: myPerson, taskId }),
    })
    poll()
  }

  const continueAfterEvidence = async (withEvidence: boolean) => {
    if (!myPerson || submitting) return
    setSubmitting(true)
    await fetch('/api/room/courtroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        person: myPerson,
        action: 'continue_after_evidence',
        evidenceDescription: withEvidence ? evidenceInput.trim() : undefined,
      }),
    })
    setEvidenceInput('')
    setSubmitting(false)
    poll()
  }

  const raiseObjection = async () => {
    if (!myPerson || submitting) return
    const granted = useUIStore.getState().useObjection(myPerson)
    if (!granted) return
    playSound('objection')
    setShowObjection(true)
    setTimeout(() => setShowObjection(false), 2000)
    setSubmitting(true)
    await fetch('/api/room/courtroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, person: myPerson, action: 'raise_objection' }),
    })
    setSubmitting(false)
    poll()
  }

  const handleMuteToggle = () => {
    const next = !isMuted
    toggleMute()
    setMuted(next)
  }

  const isMyTurn = state?.waitingFor === myPerson
  const isMyEvidenceTurn = state?.waitingForEvidence && state?.evidenceRequester === myPerson
  const canObjection = isMyTurn &&
    (state?.currentPhase === 'investigation' || state?.currentPhase === 'crossExamination') &&
    (myPerson === 'A' ? objectionsA : objectionsB) > 0

  const getName = (speaker: string) => {
    if (!state) return speaker
    if (speaker === 'userA') return state.personAName
    if (speaker === 'userB') return state.personBName
    return 'Judge'
  }

  const getInputLabel = () => {
    if (!state || !myPerson) return ''
    const myName = myPerson === 'A' ? state.personAName : state.personBName
    switch (state.currentPhase) {
      case 'opening': return `${myName}, give your opening statement:`
      case 'investigation': return `${myName}, answer the judge's question:`
      case 'crossExamination': return `${myName}, answer the judge:`
      case 'finalStatements': return `${myName}, give your closing statement:`
      default: return `${myName}, respond:`
    }
  }

  if (!state) return (
    <div className="w-screen h-screen bg-[#0d0d1a] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">⚖️</div>
        <p className="text-accent-gold text-xl animate-pulse">Court is convening...</p>
      </div>
    </div>
  )

  if (state.initializing) return (
    <div className="w-screen h-screen bg-[#0d0d1a] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⚖️</div>
        <p className="text-accent-gold text-xl animate-pulse">Judge is preparing the court...</p>
      </div>
    </div>
  )

  const historyMessages = state.conversationHistory.map(m => ({
    ...m,
    speaker: m.speaker === 'userA' ? 'userA' : m.speaker === 'userB' ? 'userB' : 'judge',
  }))

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0d0d1a]" onClick={unlockAudio}>

      {/* Phase transition cinematic overlay */}
      <AnimatePresence>
        {transitionPhase && (
          <PhaseTransition
            key={transitionPhase}
            phase={transitionPhase}
            onDone={() => setTransitionPhase(null)}
          />
        )}
      </AnimatePresence>

      {/* Objection popup */}
      <AnimatePresence>
        {showObjection && <ObjectionPopup key="objection" />}
      </AnimatePresence>

      {/* Three.js judge canvas */}
      <div className="absolute inset-0">
        <JudgeScene animState={animState} flip={animFlip} />
      </div>

      {/* Bottom vignette to blend canvas into UI */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0d0d1a] to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-none">
        <div>
          <p className="text-accent-gold font-bold text-sm">{state.courtName}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
            <span className="uppercase tracking-wider">{PHASE_LABELS[state.currentPhase] ?? state.currentPhase}</span>
            {state.currentPhase === 'crossExamination' && (
              <span className="text-accent-gold">Round {state.crossExamRound}/2</span>
            )}
            <span className={myPerson === 'A' ? 'text-blue-400 font-semibold' : 'text-purple-400 font-semibold'}>
              You: {myPerson === 'A' ? state.personAName : state.personBName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleMuteToggle}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/60 hover:text-white transition text-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
          >
            ›
          </button>
        </div>
      </div>

      {/* Processing dots */}
      <AnimatePresence>
        {(state.isProcessing || submitting) && (
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

      {/* Waiting for other player */}
      {!isMyTurn && !isMyEvidenceTurn && !state.isProcessing && state.waitingFor && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <p className="text-gray-400 text-sm animate-pulse">
            Waiting for {state.waitingFor === 'A' ? state.personAName : state.personBName}...
          </p>
        </div>
      )}

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 space-y-3">

        {/* Caption bar */}
        <CaptionBar text={currentCaption} speaker="Judge" />

        {/* Verdict */}
        <AnimatePresence>
          {state.currentPhase === 'verdict' && state.verdict && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3 max-w-2xl mx-auto w-full"
            >
              {state.courtOrders && state.courtOrders.length > 0 && (
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-2 border border-accent-gold/30">
                  <p className="text-sm font-bold text-accent-gold">📋 Court Orders:</p>
                  {state.courtOrders.map(order => {
                    const canMarkDone = !order.completed && (
                      order.assignedTo === 'both' ||
                      (order.assignedTo === 'A' && myPerson === 'B') ||
                      (order.assignedTo === 'B' && myPerson === 'A')
                    )
                    return (
                      <div key={order.id} className={`flex items-start gap-3 p-3 rounded-lg ${order.completed ? 'bg-green-900/20 border border-green-700/30' : 'bg-red-900/10 border border-red-700/20'}`}>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${order.completed ? 'line-through text-gray-500' : 'text-white'}`}>{order.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Assigned to: {order.assignedName}</p>
                        </div>
                        {order.completed ? (
                          <span className="text-green-400 text-sm font-bold">✓</span>
                        ) : canMarkDone ? (
                          <button onClick={() => markTaskDone(order.id)}
                            className="text-black text-xs font-bold px-3 py-1.5 rounded transition whitespace-nowrap bg-accent-gold hover:bg-accent-gold/80">
                            Mark Done
                          </button>
                        ) : <span className="text-gray-600 text-xs">Pending</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              <VerdictShareCard
                caseTitle={state.courtName}
                winnerName={state.verdict.winnerName}
                loserName={state.verdict.loserName}
                winner={state.verdict.winner}
                verdictOneLiner={state.verdict.text.replace(/WINNER:.*$/m, '').replace(/LOSER:.*$/m, '').trim().split('\n').filter(Boolean).at(-1) ?? state.verdict.text}
                mood={(state.mood as CourtMood) ?? 'serious'}
                personAName={state.personAName}
                personBName={state.personBName}
              />

              <button onClick={() => router.push('/')}
                className="w-full font-bold py-3 rounded-xl transition text-black bg-accent-gold hover:bg-accent-gold/80">
                ← Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evidence input */}
        <AnimatePresence>
          {isMyEvidenceTurn && !state.isProcessing && !submitting && (
            <motion.div key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 space-y-2 max-w-2xl mx-auto w-full">
              <p className="text-xs text-accent-gold font-semibold">⚖️ Do you have evidence to support your answer?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Describe your evidence (screenshot, message, etc.)..."
                  value={evidenceInput}
                  onChange={e => setEvidenceInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && evidenceInput.trim() && continueAfterEvidence(true)}
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 px-3 py-2 rounded-lg focus:outline-none focus:border-accent-gold text-sm transition"
                  autoFocus
                />
                <button onClick={() => continueAfterEvidence(true)} disabled={!evidenceInput.trim()}
                  className="bg-accent-gold/80 hover:bg-accent-gold disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg transition text-sm">
                  Submit
                </button>
                <button onClick={() => continueAfterEvidence(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition text-sm">
                  Skip
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User input */}
        <AnimatePresence>
          {isMyTurn && !state.waitingForEvidence && !state.isProcessing && !submitting && state.currentPhase !== 'verdict' && (
            <motion.div key={`input-${state.currentPhase}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2 max-w-2xl mx-auto w-full">
              <div className="flex-1 flex gap-2">
                {canObjection && (
                  <button
                    onClick={raiseObjection}
                    className="text-xs font-black tracking-widest px-3 py-2 rounded-lg border transition-all shrink-0"
                    style={{ color: '#ff3030', borderColor: '#ff3030', background: 'rgba(255,48,48,0.08)' }}
                  >
                    ✋ ({myPerson === 'A' ? objectionsA : objectionsB})
                  </button>
                )}
                <input
                  type="text"
                  placeholder={getInputLabel()}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitInput()}
                  className="flex-1 bg-black/60 backdrop-blur-sm border border-white/20 text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:border-accent-gold transition text-sm"
                  autoFocus
                />
                <button onClick={submitInput} disabled={!userInput.trim()}
                  className="bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl transition text-sm">
                  Send
                </button>
              </div>
              <button
                onClick={() => setHistoryOpen(true)}
                className="w-12 h-12 bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xl hover:bg-white/10 transition flex items-center justify-center"
              >
                ›
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* History drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        messages={historyMessages}
        nameA={state.personAName}
        nameB={state.personBName}
      />

      <div ref={bottomRef} />
    </div>
  )
}
