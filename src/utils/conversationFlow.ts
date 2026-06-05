/**
 * CONVERSATION FLOW ENGINE
 * Handles turn-taking, phase progression, and conversation flow
 */

import { CourtroomMemoryState, CourtroomPhase, recordMessage, recordUserStatement, recordEmotionalSignal, advancePhase } from './courtroomMemory'
import { OrchestratorResponse } from './courtroomOrchestrator'

export interface ConversationTurn {
  id: string
  type: 'ai_message' | 'user_input' | 'system_action'
  timestamp: number
  content: string
  speaker?: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'
}

export interface ConversationFlow {
  turns: ConversationTurn[]
  currentTurnIndex: number
  isPaused: boolean
  isWaitingForUserInput: boolean
}

/**
 * Initialize conversation flow
 */
export function initializeConversationFlow(): ConversationFlow {
  return {
    turns: [],
    currentTurnIndex: -1,
    isPaused: false,
    isWaitingForUserInput: false,
  }
}

/**
 * Add AI message to flow
 */
export function addAIMessage(
  flow: ConversationFlow,
  response: OrchestratorResponse
): ConversationFlow {
  const turn: ConversationTurn = {
    id: `turn-${Date.now()}`,
    type: 'ai_message',
    timestamp: Date.now(),
    content: response.message,
    speaker: response.speaker,
  }

  return {
    ...flow,
    turns: [...flow.turns, turn],
    currentTurnIndex: flow.turns.length,
    isWaitingForUserInput: response.allowUserInput,
  }
}

/**
 * Add user input to flow
 */
export function addUserInput(
  flow: ConversationFlow,
  memory: CourtroomMemoryState,
  speaker: 'A' | 'B',
  content: string
): ConversationFlow {
  const turn: ConversationTurn = {
    id: `turn-${Date.now()}`,
    type: 'user_input',
    timestamp: Date.now(),
    content,
    speaker: speaker === 'A' ? 'userA' : 'userB',
  }

  // Update memory with user statement
  let updatedMemory = recordUserStatement(memory, speaker, content)
  
  // Detect emotional tone
  const emotionalTone = detectEmotionalTone(content)
  if (emotionalTone) {
    updatedMemory = recordEmotionalSignal(
      updatedMemory,
      speaker,
      emotionalTone,
      calculateEmotionalIntensity(content),
      content
    )
  }

  return {
    ...flow,
    turns: [...flow.turns, turn],
    currentTurnIndex: flow.turns.length,
    isWaitingForUserInput: false,
  }
}

/**
 * Detect emotional tone from user input
 */
export function detectEmotionalTone(content: string): string | null {
  const lower = content.toLowerCase()

  // Defensive indicators
  if (lower.includes('but') || lower.includes('however') || lower.includes('actually')) {
    return 'defensive'
  }

  // Aggressive indicators
  if (lower.includes('always') || lower.includes('never') || lower.includes('you') || /[!]{2,}/.test(content)) {
    return 'aggressive'
  }

  // Emotional indicators
  if (lower.includes('feel') || lower.includes('hurt') || lower.includes('sad') || lower.includes('love')) {
    return 'emotional'
  }

  // Clarifying indicators
  if (lower.includes('mean') || lower.includes('said') || lower.includes('understand')) {
    return 'clarifying'
  }

  return null
}

/**
 * Calculate emotional intensity (0-100)
 */
export function calculateEmotionalIntensity(content: string): number {
  let intensity = 30 // baseline

  // Exclamation marks
  intensity += content.match(/[!]/g)?.length || 0 * 10

  // All caps
  if (/[A-Z]{5,}/.test(content)) {
    intensity += 20
  }

  // Emotional words
  const emotionalWords = ['devastated', 'furious', 'heartbroken', 'destroyed', 'love', 'hate', 'betrayed']
  emotionalWords.forEach(word => {
    if (content.toLowerCase().includes(word)) {
      intensity += 15
    }
  })

  return Math.min(100, intensity)
}

/**
 * Process phase transition
 */
export function processPhaseTransition(
  memory: CourtroomMemoryState,
  flow: ConversationFlow
): { memory: CourtroomMemoryState; flow: ConversationFlow; phaseChanged: boolean } {
  const previousPhase = memory.currentPhase
  const updatedMemory = advancePhase(memory)
  const phaseChanged = previousPhase !== updatedMemory.currentPhase

  const phaseTransitionTurn: ConversationTurn = {
    id: `turn-${Date.now()}`,
    type: 'system_action',
    timestamp: Date.now(),
    content: `Phase changed from ${previousPhase} to ${updatedMemory.currentPhase}`,
  }

  const updatedFlow = {
    ...flow,
    turns: phaseChanged ? [...flow.turns, phaseTransitionTurn] : flow.turns,
  }

  return {
    memory: updatedMemory,
    flow: updatedFlow,
    phaseChanged,
  }
}

/**
 * Get conversation summary for AI context
 */
export function getConversationSummary(flow: ConversationFlow): string {
  const recentTurns = flow.turns.slice(-10)
  
  return recentTurns
    .map(turn => {
      if (turn.speaker) {
        return `${turn.speaker}: ${turn.content}`
      }
      return turn.content
    })
    .join('\n')
}

/**
 * Check if phase should advance based on conversation progress
 */
export function shouldAdvancePhase(
  memory: CourtroomMemoryState,
  flow: ConversationFlow
): boolean {
  const { currentPhase, conversationHistory } = memory
  
  // Minimum messages per phase before advancing
  const minMessagesPerPhase = 3
  
  const phaseMessages = conversationHistory.filter(msg => msg.phase === currentPhase).length

  switch (currentPhase) {
    case 'opening_statements':
      // Need both lawyers to present
      return phaseMessages >= minMessagesPerPhase && memory.userStatements.A.length > 0 && memory.userStatements.B.length > 0

    case 'lawyer_reframing':
      // Allow multiple rounds, but eventually move on
      return phaseMessages >= minMessagesPerPhase && memory.round > 2

    case 'cross_examination':
      // Move on after contradictions are explored
      return memory.contradictions.length > 0 && phaseMessages >= minMessagesPerPhase

    case 'emotional_clarification':
      // Move on after emotional signals detected
      return memory.emotionalSignals.length >= 2 && phaseMessages >= minMessagesPerPhase

    case 'final_arguments':
      // Each lawyer should get a turn
      return phaseMessages >= minMessagesPerPhase

    case 'verdict':
      // Verdict is the final phase
      return false

    default:
      return phaseMessages >= minMessagesPerPhase
  }
}

/**
 * Check if user input is needed
 */
export function isUserInputNeeded(
  memory: CourtroomMemoryState,
  flow: ConversationFlow
): boolean {
  const { currentPhase, round } = memory

  // User should speak regularly throughout the case
  const messagesSinceLastUserInput = memory.conversationHistory.filter(
    msg => msg.timestamp > (memory.userStatements.A[memory.userStatements.A.length - 1]?.timestamp || 0)
  ).length

  // If more than 3 AI messages since last user input, request user input
  if (messagesSinceLastUserInput > 3) {
    return true
  }

  // Phase-specific rules
  switch (currentPhase) {
    case 'opening_statements':
      return memory.userStatements.A.length === 0 || memory.userStatements.B.length === 0

    case 'cross_examination':
      // Request input when contradictions are challenged
      return memory.contradictions.length > 0 && messagesSinceLastUserInput > 2

    case 'emotional_clarification':
      // Always request emotional input in this phase
      return messagesSinceLastUserInput > 2

    case 'final_arguments':
      // Users should have final say
      return messagesSinceLastUserInput > 2

    default:
      return false
  }
}

/**
 * Get next expected speaker based on conversation rules
 */
export function getNextExpectedSpeaker(
  memory: CourtroomMemoryState,
  flow: ConversationFlow
): 'judge' | 'lawyerA' | 'lawyerB' {
  const recentSpeakers = memory.conversationHistory.slice(-3).map(m => m.speaker)

  // Judge speaks periodically to maintain control
  if (!recentSpeakers.includes('judge') && memory.conversationHistory.length > 1) {
    return 'judge'
  }

  // Alternate between lawyers
  const lastLawyer = recentSpeakers.find(s => s === 'lawyerA' || s === 'lawyerB')
  
  if (lastLawyer === 'lawyerA' || !lastLawyer) {
    return 'lawyerB'
  }

  return 'lawyerA'
}

/**
 * Validate flow consistency
 */
export function validateFlowConsistency(
  memory: CourtroomMemoryState,
  flow: ConversationFlow
): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check phase alignment
  const phaseInTurns = flow.turns
    .filter(t => t.type === 'system_action' && t.content.includes('Phase changed'))
    .length

  if (phaseInTurns > 0 && memory.currentPhase === 'opening_statements') {
    issues.push('Phase inconsistency: phase transitions recorded but still in opening_statements')
  }

  // Check turn count
  if (flow.turns.length < memory.conversationHistory.length) {
    issues.push('Turn count mismatch: fewer turns than conversation history')
  }

  // Check user participation
  if (memory.userStatements.A.length === 0 && memory.userStatements.B.length === 0 && flow.turns.length > 5) {
    issues.push('No user participation despite multiple turns')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
