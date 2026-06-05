/**
 * SIMPLIFIED INVESTIGATION STORE
 * 
 * Manages case memory and investigation state.
 * Three states: opening → questioning → verdict
 * Simple and practical.
 */

import { create } from 'zustand'
import { CaseMemory, CaseSetup, ConversationMessage } from '@/types'

interface SimpleCourtroomStore {
  // State
  caseMemory: CaseMemory | null
  isLoading: boolean
  error: string | null
  waitingForInput: boolean
  nextSpeaker: 'userA' | 'userB' | null

  // Actions
  initializeCaseMemory: (caseSetup: CaseSetup) => Promise<void>
  startOpening: () => Promise<void>
  addUserInput: (speaker: 'userA' | 'userB', text: string) => Promise<void>
  addMessage: (speaker: ConversationMessage['speaker'], text: string) => void
  continueQuestioning: () => Promise<void>
  deliverVerdict: () => Promise<void>
  reset: () => void
}

/**
 * Call Gemini through API
 */
async function callGeminiViaAPI(
  role: 'judge' | 'lawyerA' | 'lawyerB',
  caseMemory: CaseMemory,
  instruction?: string
): Promise<string> {
  console.log(`🌐 Calling API: call-gemini (role: ${role})`)
  const response = await fetch('/api/simple-orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'call-gemini',
      role,
      caseMemory,
      instruction,
    }),
  })

  console.log('📡 API response status:', response.status)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('📦 API response data:', data)
  if (!data.success) {
    throw new Error(data.error || 'API call failed')
  }

  return data.response
}

/**
 * Detect contradictions through API
 */
async function detectContradictionsViaAPI(
  personAStatement: string,
  personBStatement: string,
  caseTitle: string
): Promise<string[]> {
  console.log('🌐 Calling API: detect-contradictions')
  const response = await fetch('/api/simple-orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'detect-contradictions',
      personAStatement,
      personBStatement,
      caseTitle,
    }),
  })

  console.log('📡 API response status:', response.status)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('📦 API response data:', data)
  if (!data.success) {
    throw new Error(data.error || 'API call failed')
  }

  return data.contradictions || []
}

export const useSimpleCourtroomStore = create<SimpleCourtroomStore>((set, get) => ({
  caseMemory: null,
  isLoading: false,
  error: null,
  waitingForInput: false,
  nextSpeaker: null,

  /**
   * Initialize case memory from form data
   */
  initializeCaseMemory: async (caseSetup: CaseSetup) => {
    set({ isLoading: true, error: null })
    console.log('🔍 Initializing case:', caseSetup.title)

    try {
      // Detect contradictions
      console.log('📍 Detecting contradictions...')
      const contradictions = await detectContradictionsViaAPI(
        caseSetup.personAArgument,
        caseSetup.personBArgument,
        caseSetup.title
      )
      console.log('✅ Contradictions detected:', contradictions)

      const caseMemory: CaseMemory = {
        personA: {
          name: caseSetup.personAName,
          statement: caseSetup.personAArgument,
        },
        personB: {
          name: caseSetup.personBName,
          statement: caseSetup.personBArgument,
        },
        title: caseSetup.title,
        contradictions,
        conversationHistory: [],
        currentState: 'opening',
        turnCount: 0,
      }

      console.log('✅ Case memory created:', caseMemory)
      set({ caseMemory, isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize'
      console.error('❌ Initialization error:', errorMsg, err)
      set({ error: errorMsg, isLoading: false })
    }
  },

  /**
   * Start opening: Lawyer A speaks, then Lawyer B
   */
  startOpening: async () => {
    const caseMemory = get().caseMemory
    if (!caseMemory) return

    set({ isLoading: true })

    try {
      // Lawyer A opening
      const lawyerAText = await callGeminiViaAPI('lawyerA', caseMemory)
      get().addMessage('lawyerA', lawyerAText)

      // Lawyer B opening
      const lawyerBText = await callGeminiViaAPI('lawyerB', caseMemory)
      get().addMessage('lawyerB', lawyerBText)

      // Transition to questioning state
      set(state => {
        if (!state.caseMemory) return state
        return {
          caseMemory: {
            ...state.caseMemory,
            currentState: 'questioning',
          },
        }
      })

      // Judge asks first question
      await get().continueQuestioning()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Opening failed'
      set({ error: errorMsg })
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * Continue questioning - judge asks next question
   */
  continueQuestioning: async () => {
    const caseMemory = get().caseMemory
    if (!caseMemory || caseMemory.currentState !== 'questioning') return

    set({ isLoading: true })

    try {
      // Alternate who the judge asks
      const nextTarget = caseMemory.turnCount % 2 === 0 ? 'userA' : 'userB'
      const targetName = nextTarget === 'userA' ? caseMemory.personA.name : caseMemory.personB.name

      const instruction = `Ask ${targetName} ONE sharp question about the contradictions or unclear points.
Reference actual facts from their statements.
Keep it under 3 sentences.
Be investigative and direct.`

      const judgeQuestion = await callGeminiViaAPI('judge', caseMemory, instruction)
      get().addMessage('judge', judgeQuestion)

      set({ waitingForInput: true, nextSpeaker: nextTarget, isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Questioning failed'
      set({ error: errorMsg, isLoading: false })
    }
  },

  /**
   * Add user input and fetch next judge response
   */
  addUserInput: async (speaker: 'userA' | 'userB', text: string) => {
    const caseMemory = get().caseMemory
    if (!caseMemory) return

    // Add user message
    get().addMessage(speaker, text)

    set({ waitingForInput: false, isLoading: true })

    try {
      // Check if we should deliver verdict (after 5+ turns)
      if (caseMemory.turnCount >= 5) {
        // Give judge chance to decide: more questions or verdict?
        const decision = await callGeminiViaAPI(
          'judge',
          caseMemory,
          `Based on the investigation so far, decide:
Do you have enough information to deliver a verdict?
If YES, respond with exactly: "VERDICT_READY"
If NO, respond with exactly: "MORE_QUESTIONS" followed by your next question.`
        )

        if (decision.includes('VERDICT_READY')) {
          await get().deliverVerdict()
          return
        }
      }

      // Continue questioning
      await get().continueQuestioning()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process input'
      set({ error: errorMsg, isLoading: false })
    }
  },

  /**
   * Add a message to conversation history
   */
  addMessage: (speaker: ConversationMessage['speaker'], text: string) => {
    set(state => {
      if (!state.caseMemory) return state

      const updatedMemory: CaseMemory = {
        ...state.caseMemory,
        conversationHistory: [
          ...state.caseMemory.conversationHistory,
          {
            speaker,
            text,
            timestamp: Date.now(),
          },
        ],
        turnCount: state.caseMemory.turnCount + 1,
      }

      return { caseMemory: updatedMemory }
    })
  },

  /**
   * Deliver final verdict
   */
  deliverVerdict: async () => {
    const caseMemory = get().caseMemory
    if (!caseMemory) return

    set({ isLoading: true })

    try {
      const verdictPrompt = `You are the Judge. Deliver a FINAL VERDICT based on the investigation.

Consider:
- The contradictions found
- How each person responded to questions
- Emotional truths revealed
- Who seems more credible

Deliver a SHORT, fair verdict (3-4 sentences max).
Be direct. Summarize the truth of the situation.`

      const verdict = await callGeminiViaAPI('judge', caseMemory, verdictPrompt)

      set(state => {
        if (!state.caseMemory) return state
        return {
          caseMemory: {
            ...state.caseMemory,
            currentState: 'verdict',
            verdictText: verdict,
          },
          isLoading: false,
          waitingForInput: false,
        }
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verdict failed'
      set({ error: errorMsg, isLoading: false })
    }
  },

  /**
   * Reset for new case
   */
  reset: () => {
    set({
      caseMemory: null,
      isLoading: false,
      error: null,
      waitingForInput: false,
      nextSpeaker: null,
    })
  },
}))
