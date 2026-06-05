/**
 * INVESTIGATION STORE - NEW ZUSTAND STORE FOR INVESTIGATION-DRIVEN COURTROOM
 * 
 * Manages the new investigation-centric courtroom experience.
 * Uses CourtState instead of CourtroomMemoryState.
 */

import { create } from 'zustand'
import { CaseSetup } from '@/types'
import { CourtState, JudgeResponse, initializeCourtState } from '@/utils/newJudgeOrchestrator'

export interface InvestigationMessage {
  id: string
  speaker: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'
  message: string
  timestamp: number
  messageType: 'statement' | 'question' | 'challenge' | 'verdict' | 'observation'
  intensity?: number
  tone?: string
}

export interface InvestigationStore {
  // Session state
  caseSetup: CaseSetup | null
  courtState: CourtState | null
  sessionId: string | null
  isLoading: boolean
  error: string | null

  // UI state
  messages: InvestigationMessage[]
  isWaitingForUserInput: boolean
  nextTarget: 'userA' | 'userB' | null
  isVerdictPhase: boolean

  // Actions
  initializeSession: (caseSetup: CaseSetup) => Promise<void>
  submitUserInput: (speaker: 'userA' | 'userB', input: string) => Promise<void>
  fetchNextTurn: (userInput?: { speaker: 'userA' | 'userB'; content: string }) => Promise<void>
  addMessage: (message: InvestigationMessage) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearSession: () => void

  // Debug
  getState: () => CourtState | null
  getMessages: () => InvestigationMessage[]
}

export const useInvestigationStore = create<InvestigationStore>((set, get) => ({
  // Initial state
  caseSetup: null,
  courtState: null,
  sessionId: null,
  isLoading: false,
  error: null,
  messages: [],
  isWaitingForUserInput: false,
  nextTarget: null,
  isVerdictPhase: false,

  /**
   * Initialize a new investigation session
   */
  initializeSession: async (caseSetup: CaseSetup) => {
    set({
      caseSetup,
      courtState: initializeCourtState(caseSetup),
      sessionId: `investigation-${Date.now()}`,
      isLoading: true,
      error: null,
      messages: [],
      isWaitingForUserInput: false,
      isVerdictPhase: false,
      nextTarget: null,
    })

    // Fetch opening judge statement
    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseSetup,
          isInitialization: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Initialization error: ${response.status}`)
      }

      const data = await response.json()
      const { judgeResponse, updatedState } = data

      // Add opening message
      const message: InvestigationMessage = {
        id: `msg-${Date.now()}`,
        speaker: judgeResponse.speaker,
        message: judgeResponse.message,
        timestamp: Date.now(),
        messageType: judgeResponse.messageType,
        intensity: judgeResponse.intensity,
        tone: judgeResponse.tone,
      }

      set({
        messages: [message],
        courtState: updatedState,
        isLoading: false,
        isWaitingForUserInput: judgeResponse.requiresUserResponse,
        nextTarget: (judgeResponse.nextTarget as 'userA' | 'userB' | null) || null,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize'
      set({
        error: errorMsg,
        isLoading: false,
      })
    }
  },

  /**
   * Submit user input and fetch next judge response
   */
  submitUserInput: async (speaker: 'userA' | 'userB', input: string) => {
    const state = get()
    if (!state.courtState) return

    // Add user message to UI immediately
    const userMessage: InvestigationMessage = {
      id: `msg-${Date.now()}`,
      speaker,
      message: input,
      timestamp: Date.now(),
      messageType: 'statement',
    }

    set(s => ({
      messages: [...s.messages, userMessage],
      isWaitingForUserInput: false,
    }))

    // Fetch next turn with user input
    await get().fetchNextTurn({ speaker, content: input })
  },

  /**
   * Fetch next turn from orchestrator API
   */
  fetchNextTurn: async (userInput?: { speaker: 'userA' | 'userB'; content: string }) => {
    const state = get()
    if (!state.courtState) return

    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: state.courtState,
          userInput: userInput
            ? {
                speaker: userInput.speaker,
                content: userInput.content,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const { judgeResponse, updatedState, readyForVerdict } = data

      if (!judgeResponse) {
        throw new Error('No judge response received')
      }

      // Add judge message to UI
      const message: InvestigationMessage = {
        id: `msg-${Date.now()}`,
        speaker: judgeResponse.speaker,
        message: judgeResponse.message,
        timestamp: Date.now(),
        messageType: judgeResponse.messageType,
        intensity: judgeResponse.intensity,
        tone: judgeResponse.tone,
      }

      set(s => ({
        messages: [...s.messages, message],
        courtState: updatedState,
        isLoading: false,
        isWaitingForUserInput: judgeResponse.requiresUserResponse,
        nextTarget: (judgeResponse.nextTarget as 'userA' | 'userB' | null) || null,
        isVerdictPhase: readyForVerdict || judgeResponse.messageType === 'verdict',
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch next turn'
      set({
        error: errorMsg,
        isLoading: false,
      })
    }
  },

  /**
   * Add a message to the UI
   */
  addMessage: (message: InvestigationMessage) => {
    set(s => ({
      messages: [...s.messages, message],
    }))
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error })
  },

  /**
   * Clear session and reset to initial state
   */
  clearSession: () => {
    set({
      caseSetup: null,
      courtState: null,
      sessionId: null,
      isLoading: false,
      error: null,
      messages: [],
      isWaitingForUserInput: false,
      isVerdictPhase: false,
      nextTarget: null,
    })
  },

  /**
   * Get current court state (for debugging)
   */
  getState: () => {
    return get().courtState
  },

  /**
   * Get all messages (for debugging)
   */
  getMessages: () => {
    return get().messages
  },
}))
