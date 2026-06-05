'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import CourtroomLayout from '@/components/CourtroomLayout'
import PhaseTransition from '@/components/PhaseTransition'
import ObjectionPopup from '@/components/ObjectionPopup'
import VerdictShareCard from '@/components/VerdictShareCard'
import { useUIStore, THEME_CONFIG } from '@/hooks/useUIStore'
import { playSound, startAmbience, stopAmbience, stopTyping, startTyping } from '@/utils/soundService'
import type { CourtMood } from '@/types'

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

  const { setMood: setStoreMood, objectionsA, objectionsB } = useUIStore()

  const [myPerson, setMyPerson] = useState<'A' | 'B' | null>(null)
  const [state, setState] = useState<CourtroomState | null>(null)
  const [userInput, setUserInput] = useState('')
  const [evidenceInput, setEvidenceInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transitionPhase, setTransitionPhase] = useState<string | null>(null)
  const [showObjection, setShowObjection] = useState(false)
  const lastUpdated = useRef(0)
  const prevPhase = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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
    if (state?.isProcessing || submitting) {
      startTyping()
    } else {
      stopTyping()
    }
  }, [state?.isProcessing, submitting])

  // Winner reveal sound
  const verdictShownRef = useRef(false)
  useEffect(() => {
    if (state?.verdict && !verdictShownRef.current) {
      verdictShownRef.current = true
      playSound('winner')
    }
  }, [state?.verdict])

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
    // Use getState() to avoid hook-in-callback rule violation
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
      case 'opening': return `${myName}, give your opening statement (2-3 sentences):`
      case 'investigation': return `${myName}, answer the judge's question:`
      case 'crossExamination': return `${myName}, answer the judge:`
      case 'finalStatements': return `${myName}, give your closing statement:`
      default: return `${myName}, respond:`
    }
  }

  if (!state) return (
    <CourtroomLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent-gold text-xl animate-pulse">Court is convening...</div>
      </div>
    </CourtroomLayout>
  )

  if (state.initializing) return (
    <CourtroomLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <p className="text-accent-gold text-xl animate-pulse">Judge is preparing the court...</p>
        </div>
      </div>
    </CourtroomLayout>
  )

  return (
    <CourtroomLayout>
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

      <div className="min-h-screen flex flex-col relative">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 pt-6 pb-28">

          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--theme-accent)', opacity: 0.6 }}>
              {THEME_CONFIG[(state.mood as CourtMood) ?? 'serious'].judgeLabel}
            </p>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-accent)' }}>{state.courtName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              <span>Phase: <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>{PHASE_LABELS[state.currentPhase] ?? state.currentPhase}</span></span>
              {state.currentPhase === 'crossExamination' && (
                <><span>•</span><span>Round: <span style={{ color: 'var(--theme-accent)' }}>{state.crossExamRound}/2</span></span></>
              )}
              <span>•</span>
              <span className={`${myPerson === 'A' ? 'text-blue-400' : 'text-purple-400'} font-semibold`}>
                You: {myPerson === 'A' ? state.personAName : state.personBName}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {state.conversationHistory.map((msg, idx) => {
                const isRight = msg.speaker === 'userB'
                const isJudge = msg.speaker === 'judge'
                const bgClass = isJudge
                  ? 'bg-accent-gold/10 border-accent-gold/50'
                  : msg.speaker === 'userA'
                  ? 'bg-blue-900/20 border-blue-500/30'
                  : 'bg-purple-900/20 border-purple-500/30'

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: isRight ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-2xl px-4 py-3 rounded-lg border ${bgClass}`}>
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {isJudge ? '⚖️' : '🧑'} {getName(msg.speaker)}
                      </p>
                      <p className="text-sm leading-relaxed text-white">{msg.text}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {(state.isProcessing || submitting) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="px-4 py-3 rounded-lg border border-accent-gold/50 bg-accent-gold/10">
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ scale: [1, 1.2, 1] }}
                          transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                          className="w-2 h-2 bg-accent-gold rounded-full" />
                      ))}
                    </div>
                    <p className="text-xs text-accent-gold">Judge considering...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!isMyTurn && !isMyEvidenceTurn && !state.isProcessing && state.waitingFor && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                <p className="text-gray-500 text-sm animate-pulse">
                  Waiting for {state.waitingFor === 'A' ? state.personAName : state.personBName}...
                </p>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 px-4 py-4">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">

              {/* Evidence decision */}
              {isMyEvidenceTurn && !state.isProcessing && !submitting && (
                <motion.div key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <p className="text-sm font-semibold text-accent-gold">
                    ⚖️ Do you have evidence to support your answer?
                  </p>
                  <input
                    type="text"
                    placeholder="Describe your evidence (screenshot, message, etc.)..."
                    value={evidenceInput}
                    onChange={e => setEvidenceInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && evidenceInput.trim() && continueAfterEvidence(true)}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button onClick={() => continueAfterEvidence(true)} disabled={!evidenceInput.trim()}
                      className="flex-1 bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-40 text-black font-bold py-2 rounded transition">
                      Submit Evidence
                    </button>
                    <button onClick={() => continueAfterEvidence(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition">
                      No Evidence — Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* User input */}
              {isMyTurn && !state.waitingForEvidence && !state.isProcessing && !submitting && (
                <motion.div key={`input-${state.currentPhase}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold" style={{ color: 'var(--theme-accent)' }}>{getInputLabel()}</label>
                    {/* OBJECTION button */}
                    {canObjection && (
                      <button
                        onClick={raiseObjection}
                        className="text-xs font-black tracking-widest px-3 py-1.5 rounded border transition-all"
                        style={{
                          color: '#ff3030',
                          borderColor: '#ff3030',
                          background: 'rgba(255,48,48,0.08)',
                        }}
                      >
                        ✋ OBJECTION ({myPerson === 'A' ? objectionsA : objectionsB})
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your statement..."
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitInput()}
                      className="flex-1 bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none transition"
                      style={{ '--tw-ring-color': 'var(--theme-accent)' } as React.CSSProperties}
                      autoFocus
                    />
                    <button onClick={submitInput} disabled={!userInput.trim()}
                      className="disabled:opacity-50 text-black font-bold px-6 py-2 rounded transition"
                      style={{ backgroundColor: 'var(--theme-accent)' }}>
                      Submit
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Verdict display + share card */}
              {state.currentPhase === 'verdict' && state.verdict && (
                <motion.div key="verdict" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 pb-4">
                  {/* Court orders / penalties */}
                  {state.courtOrders && state.courtOrders.length > 0 && (
                    <div className="rounded-lg p-4 space-y-2" style={{ background: `rgba(var(--theme-glow-rgb), 0.08)`, border: `1px solid rgba(var(--theme-glow-rgb), 0.25)` }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-accent)' }}>📋 Court Orders:</p>
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
                              {canMarkDone && <p className="text-xs text-gray-500 mt-0.5">Once done in front of you, mark it</p>}
                            </div>
                            {order.completed ? (
                              <span className="text-green-400 text-sm font-bold">✓</span>
                            ) : canMarkDone ? (
                              <button onClick={() => markTaskDone(order.id)}
                                className="text-black text-xs font-bold px-3 py-1.5 rounded transition whitespace-nowrap"
                                style={{ backgroundColor: 'var(--theme-accent)' }}>
                                Mark Done
                              </button>
                            ) : <span className="text-gray-600 text-xs">Pending</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Shareable card + social buttons */}
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
                    className="w-full font-bold py-3 rounded-lg transition text-black"
                    style={{ backgroundColor: 'var(--theme-accent)' }}>
                    ← Back to Home
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </CourtroomLayout>
  )
}
