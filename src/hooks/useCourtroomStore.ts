import { create } from 'zustand'
import {
  CaseMemory,
  CaseSetup,
  CourtPhase,
  ConversationMessage,
  Evidence,
  VerdictData,
} from '@/types'

interface CourtroomState {
  caseMemory: CaseMemory | null
  caseSetup: CaseSetup | null
  isLoading: boolean
  error: string | null
  waitingForUserInput: boolean
  nextSpeaker: 'userA' | 'userB' | null
  waitingForEvidence: boolean
  evidenceRequester: 'userA' | 'userB' | null

  initializeCase: (setup: CaseSetup) => Promise<void>
  moveToPhase: (phase: CourtPhase) => Promise<void>
  addMessage: (speaker: ConversationMessage['speaker'], text: string) => void
  addUserInput: (speaker: 'userA' | 'userB', text: string) => Promise<void>
  continueAfterEvidence: (evidence?: Evidence) => Promise<void>
  setUserInputWaiting: (waiting: boolean, nextSpeaker?: 'userA' | 'userB') => void
  completeTask: (taskId: string) => void
  reset: () => void
}

const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const createInitialCaseMemory = (setup: CaseSetup): CaseMemory => ({
  id: createId(),
  title: setup.title,
  mood: setup.mood,
  createdAt: Date.now(),
  personA: {
    name: setup.personAName,
    statement: setup.personAArgument,
  },
  personB: {
    name: setup.personBName,
    statement: setup.personBArgument,
  },
  contradictions: [],
  emotionalSignals: { personA: [], personB: [] },
  evidence: [],
  conversationHistory: [],
  language: setup.language ?? 'english',
  currentPhase: 'opening',
  phaseHistory: ['opening'],
  phaseTurns: 0,
  totalTurns: 0,
  investigationComplete: false,
  evidenceRequested: false,
  currentlyQuestioning: null,
  crossExamRound: 0,
})

export const useCourtroomStore = create<CourtroomState>((set, get) => ({
  caseMemory: null,
  caseSetup: null,
  isLoading: false,
  error: null,
  waitingForUserInput: false,
  nextSpeaker: null,
  waitingForEvidence: false,
  evidenceRequester: null,

  initializeCase: async (setup: CaseSetup) => {
    set({ isLoading: true, error: null })
    try {
      const caseMemory = createInitialCaseMemory(setup)
      set({ caseMemory, caseSetup: setup })
      await get().moveToPhase('opening')
    } catch (error) {
      set({ error: String(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  moveToPhase: async (phase: CourtPhase) => {
    set({ isLoading: true, error: null })
    try {
      const caseMemory = get().caseMemory
      if (!caseMemory) throw new Error('No case memory')

      caseMemory.currentPhase = phase
      caseMemory.phaseHistory.push(phase)
      caseMemory.phaseTurns = 0

      switch (phase) {
        case 'opening':
          await handleOpeningPhase(caseMemory)
          break
        case 'investigation':
          await handleInvestigationPhase(caseMemory)
          break
        case 'crossExamination':
          await handleCrossExaminationPhase(caseMemory)
          break
        case 'finalStatements':
          await handleFinalStatementsPhase(caseMemory)
          break
        case 'verdict':
          await handleVerdictPhase(caseMemory)
          break
      }

      set({ caseMemory })
    } catch (error) {
      set({ error: String(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  addMessage: (speaker, text) => {
    const caseMemory = get().caseMemory
    if (!caseMemory) return
    caseMemory.conversationHistory.push({ speaker, text, timestamp: Date.now() })
    caseMemory.totalTurns++
    caseMemory.phaseTurns++
    set({ caseMemory })
  },

  addUserInput: async (speaker, text) => {
    set({ isLoading: true, waitingForUserInput: false })
    try {
      const caseMemory = get().caseMemory
      if (!caseMemory) throw new Error('No case memory')

      get().addMessage(speaker, text)

      const { currentPhase } = caseMemory

      if (currentPhase === 'opening') {
        if (speaker === 'userA') {
          set({ waitingForUserInput: true, nextSpeaker: 'userB', isLoading: false })
          return
        } else {
          await get().moveToPhase('investigation')
        }
      } else if (currentPhase === 'investigation' || currentPhase === 'crossExamination') {
        set({ waitingForEvidence: true, evidenceRequester: speaker, isLoading: false })
        return
      } else if (currentPhase === 'finalStatements') {
        if (speaker === 'userA') {
          caseMemory.personA.finalStatement = text
          const judgeInviteB = await callGeminiForPhase(caseMemory, 'finalStatements', 'judge', 'inviteB')
          get().addMessage('judge', judgeInviteB)
          set({ caseMemory, waitingForUserInput: true, nextSpeaker: 'userB' })
        } else {
          caseMemory.personB.finalStatement = text
          set({ caseMemory })
          await get().moveToPhase('verdict')
        }
      }
    } catch (error) {
      set({ error: String(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  continueAfterEvidence: async (evidence?: Evidence) => {
    const caseMemory = get().caseMemory
    if (!caseMemory) return

    set({ waitingForEvidence: false, evidenceRequester: null, isLoading: true })

    try {
      if (evidence) {
        caseMemory.evidence.push(evidence)
        const analysis = await callGeminiForPhase(caseMemory, 'evidence', 'judge')
        get().addMessage('judge', analysis)
      }

      const { currentPhase, crossExamRound } = caseMemory

      if (currentPhase === 'investigation') {
        await get().moveToPhase('crossExamination')
      } else if (currentPhase === 'crossExamination') {
        if (crossExamRound >= 2) {
          await get().moveToPhase('finalStatements')
        } else {
          set({ isLoading: true })
          await handleCrossExaminationPhase(caseMemory)
          set({ caseMemory })
        }
      }
    } catch (error) {
      set({ error: String(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  setUserInputWaiting: (waiting, nextSpeaker) => {
    set({ waitingForUserInput: waiting, nextSpeaker: nextSpeaker || null })
  },

  completeTask: (taskId: string) => {
    const caseMemory = get().caseMemory
    if (!caseMemory?.verdict) return
    const task = caseMemory.verdict.courtOrders.find(t => t.id === taskId)
    if (task) {
      task.completed = true
      task.completedAt = Date.now()
      set({ caseMemory })
    }
  },

  reset: () => {
    set({
      caseMemory: null,
      caseSetup: null,
      isLoading: false,
      error: null,
      waitingForUserInput: false,
      nextSpeaker: null,
      waitingForEvidence: false,
      evidenceRequester: null,
    })
  },
}))

// ==========================================
// PHASE HANDLERS
// ==========================================

async function handleOpeningPhase(caseMemory: CaseMemory) {
  const judgeSummary = await callGeminiForPhase(caseMemory, 'opening', 'judge')
  caseMemory.conversationHistory.push({ speaker: 'judge', text: judgeSummary, timestamp: Date.now() })
  caseMemory.totalTurns++
  useCourtroomStore.getState().setUserInputWaiting(true, 'userA')
}

async function handleInvestigationPhase(caseMemory: CaseMemory) {
  caseMemory.currentlyQuestioning = 'userA'
  const judgeQuestion = await callGeminiForPhase(caseMemory, 'investigation', 'judge')
  caseMemory.conversationHistory.push({ speaker: 'judge', text: judgeQuestion, timestamp: Date.now() })
  caseMemory.totalTurns++
  useCourtroomStore.getState().setUserInputWaiting(true, 'userA')
}

async function handleCrossExaminationPhase(caseMemory: CaseMemory) {
  caseMemory.currentlyQuestioning = 'userB'
  caseMemory.crossExamRound++
  const judgeQuestion = await callGeminiForPhase(caseMemory, 'crossExamination', 'judge')
  caseMemory.conversationHistory.push({ speaker: 'judge', text: judgeQuestion, timestamp: Date.now() })
  caseMemory.totalTurns++
  useCourtroomStore.getState().setUserInputWaiting(true, 'userB')
}

async function handleFinalStatementsPhase(caseMemory: CaseMemory) {
  const judgeInviteA = await callGeminiForPhase(caseMemory, 'finalStatements', 'judge', 'inviteA')
  caseMemory.conversationHistory.push({ speaker: 'judge', text: judgeInviteA, timestamp: Date.now() })
  caseMemory.totalTurns++
  useCourtroomStore.getState().setUserInputWaiting(true, 'userA')
}

async function handleVerdictPhase(caseMemory: CaseMemory) {
  const verdictText = await callGeminiForPhase(caseMemory, 'verdict', 'judge')
  caseMemory.conversationHistory.push({ speaker: 'judge', text: verdictText, timestamp: Date.now() })
  caseMemory.totalTurns++

  const verdict = await parseVerdictFromAI(caseMemory, verdictText)
  caseMemory.verdict = verdict
  caseMemory.investigationComplete = true

  saveCaseToHistory(caseMemory)
}

// ==========================================
// API CALLS
// ==========================================

async function callGeminiForPhase(
  caseMemory: CaseMemory,
  phase: CourtPhase,
  role: 'judge' | 'lawyerA' | 'lawyerB' = 'judge',
  subRole?: string
): Promise<string> {
  const response = await fetch('/api/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'call-gemini-phase', caseMemory, phase, role, subRole }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to call AI')
  }

  const data = await response.json()
  return data.response
}

async function parseVerdictFromAI(caseMemory: CaseMemory, verdictText: string): Promise<VerdictData> {
  const response = await fetch('/api/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'parse-verdict', caseMemory, verdictText }),
  })

  if (!response.ok) throw new Error('Failed to parse verdict')
  const data = await response.json()
  return data.verdictData
}

// ==========================================
// PERSIST CASE TO HISTORY
// ==========================================

function saveCaseToHistory(caseMemory: CaseMemory) {
  if (!caseMemory.verdict) return
  try {
    const storedCases = localStorage.getItem('courtroomCases')
    const cases = storedCases ? JSON.parse(storedCases) : []
    cases.push({
      id: caseMemory.id,
      title: caseMemory.title,
      winner: caseMemory.verdict.winner,
      date: caseMemory.createdAt,
      mode: caseMemory.mood,
      personAName: caseMemory.personA.name,
      personBName: caseMemory.personB.name,
      verdictSummary: caseMemory.verdict.verdictText.substring(0, 200),
      courtOrders: caseMemory.verdict.courtOrders,
    })
    localStorage.setItem('courtroomCases', JSON.stringify(cases))
  } catch (error) {
    console.error('❌ Error saving case to history:', error)
  }
}
