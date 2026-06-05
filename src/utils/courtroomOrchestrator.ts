/**
 * AI COURTROOM ORCHESTRATOR
 * Single decision point for all AI responses
 * Returns structured JSON with speaker, message, phase, and user actions
 */

import { CaseSetup, CourtMood } from '@/types'
import {
  CourtroomMemoryState,
  CourtroomPhase,
  Speaker,
  getMemorySummary,
} from './courtroomMemory'
import { generateCourtMessage } from './geminiService'

export type OrchestratorAction =
  | 'next_speaker'
  | 'ask_clarification'
  | 'challenge_contradiction'
  | 'reveal_emotional_layer'
  | 'advance_phase'
  | 'request_user_input'
  | 'deliver_verdict'

/**
 * AI Orchestrator Response - structured JSON format
 */
export interface OrchestratorResponse {
  // Identity
  speaker: 'judge' | 'lawyerA' | 'lawyerB'
  
  // Core message
  message: string
  
  // Context
  phase: CourtroomPhase
  action: OrchestratorAction
  
  // User interaction
  allowUserInput: boolean
  userInputType?: 'clarification' | 'response' | 'objection'
  userOptions?: {
    speak: string // "You Want To Say Something?"
    continue: string // "Lawyer Continues"
  }
  
  // Pacing
  messageDuration: number // milliseconds before next action
  hasTyping: boolean
  
  // Metadata for frontend
  mood?: CourtMood
  emotional: {
    intensity: number // 0-100
    tone: 'aggressive' | 'calm' | 'curious' | 'emotional' | 'analytical'
  }
  
  // For logging/debugging
  reasoning?: string
}

/**
 * Main orchestration function
 */
export async function orchestrateNextTurn(
  memory: CourtroomMemoryState,
  userInputIfAny?: {
    speaker: 'A' | 'B'
    content: string
  }
): Promise<OrchestratorResponse> {
  // Determine what should happen next based on current state
  const context = buildOrchestratorContext(memory)
  
  // Choose the appropriate action
  const action = determineNextAction(memory, context)
  
  // Generate response based on action (now async)
  const response = await generateResponse(memory, action, context)
  
  return response
}

interface OrchestratorContext {
  phase: CourtroomPhase
  round: number
  recentMessages: number
  hasUnresolvedQuestions: boolean
  contradictionCount: number
  emotionalTensionLevel: number
  userParticipationLevel: number
  mood: CourtMood
  memorySummary: string
}

function buildOrchestratorContext(memory: CourtroomMemoryState): OrchestratorContext {
  const emotionalSignals = memory.emotionalSignals.slice(-10)
  const avgIntensity = emotionalSignals.length > 0
    ? emotionalSignals.reduce((sum, s) => sum + s.intensity, 0) / emotionalSignals.length
    : 0

  const userParticipation = memory.userStatements.A.length + memory.userStatements.B.length

  return {
    phase: memory.currentPhase,
    round: memory.round,
    recentMessages: memory.conversationHistory.slice(-5).length,
    hasUnresolvedQuestions: memory.unresolvedQuestions.some(q => q.status === 'asked'),
    contradictionCount: memory.contradictions.length,
    emotionalTensionLevel: Math.min(100, avgIntensity),
    userParticipationLevel: userParticipation,
    mood: memory.caseSetup.mood,
    memorySummary: getMemorySummary(memory),
  }
}

/**
 * Determine what action should happen next
 */
function determineNextAction(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): OrchestratorAction {
  const { phase, hasUnresolvedQuestions, contradictionCount, userParticipationLevel } = context

  // Phase-based action determination
  switch (phase) {
    case 'opening_statements':
      // Lawyers present initial arguments, judge may ask for clarification
      if (memory.conversationHistory.length < 2) {
        return 'next_speaker' // Let lawyers present
      }
      if (hasUnresolvedQuestions && userParticipationLevel < 2) {
        return 'request_user_input' // Get user input early
      }
      return 'advance_phase'

    case 'lawyer_reframing':
      // Lawyers reinterpret and defend
      if (contradictionCount > memory.conversationHistory.length / 4) {
        return 'challenge_contradiction' // Focus on contradictions
      }
      if (memory.round > 1 && hasUnresolvedQuestions) {
        return 'ask_clarification'
      }
      // After enough messages in this phase, advance to cross_examination
      if (memory.conversationHistory.length > 6) {
        return 'advance_phase'
      }
      return 'next_speaker'

    case 'cross_examination':
      // Deep questioning and contradiction challenges
      if (contradictionCount > 0) {
        return 'challenge_contradiction'
      }
      // After enough messages, move to emotional clarification
      if (memory.conversationHistory.length > 10) {
        return 'advance_phase'
      }
      return 'ask_clarification'

    case 'emotional_clarification':
      // Reveal emotional layers, ask about impact
      if (memory.emotionalSignals.length < 2) {
        return 'reveal_emotional_layer'
      }
      // After exploring emotions, move to final arguments
      if (memory.conversationHistory.length > 12) {
        return 'advance_phase'
      }
      return 'ask_clarification'

    case 'final_arguments':
      // Lawyers wrap up
      if (userParticipationLevel < memory.round * 2) {
        return 'request_user_input'
      }
      return 'advance_phase'

    case 'verdict':
      return 'deliver_verdict'

    default:
      return 'next_speaker'
  }
}

/**
 * Generate the actual response based on action
 */
async function generateResponse(
  memory: CourtroomMemoryState,
  action: OrchestratorAction,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  const { mood, phase } = context

  switch (action) {
    case 'next_speaker':
      return await generateNextSpeakerResponse(memory, context)

    case 'ask_clarification':
      return await generateClarificationResponse(memory, context)

    case 'challenge_contradiction':
      return await generateContradictionChallengeResponse(memory, context)

    case 'reveal_emotional_layer':
      return await generateEmotionalRevealResponse(memory, context)

    case 'request_user_input':
      return await generateUserInputRequestResponse(memory, context)

    case 'advance_phase':
      return await generatePhaseAdvanceResponse(memory, context)

    case 'deliver_verdict':
      return await generateVerdictResponse(memory, context)

    default:
      return await generateNextSpeakerResponse(memory, context)
  }
}

/**
 * Response generators for each action
 */

async function generateNextSpeakerResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  const { mood, phase } = context
  const lawyerIndex = memory.conversationHistory.filter(m => m.speaker === 'lawyerA' || m.speaker === 'lawyerB').length % 2

  const speaker = lawyerIndex === 0 ? 'lawyerA' : 'lawyerB'

  // Generate message (with Gemini if available, fallback otherwise)
  let message = 'The case proceeds...'
  try {
    message = await generateCourtMessage({
      speaker,
      phase,
      memory,
      mood,
      action: 'next_speaker',
    })
  } catch (error) {
    console.error('Failed to generate message:', error)
  }

  return {
    speaker,
    message: message || 'The case proceeds...',
    phase,
    action: 'next_speaker',
    allowUserInput: true,
    userOptions: {
      speak: 'You Want To Say Something?',
      continue: 'Lawyer Continues',
    },
    messageDuration: 2500,
    hasTyping: true,
    mood,
    emotional: {
      intensity: speaker === 'lawyerA' ? 70 : 50,
      tone: speaker === 'lawyerA' ? 'emotional' : 'analytical',
    },
  }
}

async function generateClarificationResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  let message = `Clarification needed. ${memory.caseSetup.personAName}, can you elaborate?`
  
  try {
    message = await generateCourtMessage({
      speaker: 'judge',
      phase: context.phase,
      memory,
      mood: context.mood,
      action: 'ask_clarification',
    })
  } catch (error) {
    console.error('Failed to generate clarification:', error)
  }

  return {
    speaker: 'judge',
    message,
    phase: context.phase,
    action: 'ask_clarification',
    allowUserInput: true,
    userInputType: 'clarification',
    userOptions: {
      speak: 'You Want To Clarify?',
      continue: 'Proceed Without Clarification',
    },
    messageDuration: 3000,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 65,
      tone: 'curious',
    },
  }
}

async function generateContradictionChallengeResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  const targetSpeaker = memory.conversationHistory.length % 2 === 0 ? 'lawyerA' : 'lawyerB'
  let message = 'Your honor, I must challenge the inconsistencies presented.'

  try {
    message = await generateCourtMessage({
      speaker: targetSpeaker,
      phase: context.phase,
      memory,
      mood: context.mood,
      action: 'challenge_contradiction',
    })
  } catch (error) {
    console.error('Failed to generate contradiction challenge:', error)
  }

  return {
    speaker: targetSpeaker,
    message,
    phase: context.phase,
    action: 'challenge_contradiction',
    allowUserInput: true,
    userOptions: {
      speak: 'You Want To Respond?',
      continue: 'Lawyer Responds',
    },
    messageDuration: 2800,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 75,
      tone: targetSpeaker === 'lawyerA' ? 'aggressive' : 'analytical',
    },
  }
}

async function generateEmotionalRevealResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  let message = 'Beneath the facts lies something deeper. What was the emotional impact?'
  
  try {
    message = await generateCourtMessage({
      speaker: 'judge',
      phase: context.phase,
      memory,
      mood: context.mood,
      action: 'reveal_emotional_layer',
    })
  } catch (error) {
    console.error('Failed to generate emotional reveal:', error)
  }

  return {
    speaker: 'judge',
    message,
    phase: context.phase,
    action: 'reveal_emotional_layer',
    allowUserInput: true,
    userInputType: 'response',
    userOptions: {
      speak: 'Express The Emotional Impact',
      continue: 'Move Forward',
    },
    messageDuration: 3500,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 80,
      tone: 'emotional',
    },
  }
}

async function generateUserInputRequestResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  const lastSpeaker = memory.userStatements.A.length > memory.userStatements.B.length ? 'B' : 'A'
  const personName = lastSpeaker === 'A' ? memory.caseSetup.personAName : memory.caseSetup.personBName
  let message = `${personName}, this is your moment. The court is listening. What else should we know?`

  try {
    message = await generateCourtMessage({
      speaker: 'judge',
      phase: context.phase,
      memory,
      mood: context.mood,
      action: 'request_user_input',
    })
  } catch (error) {
    console.error('Failed to generate user input request:', error)
  }

  return {
    speaker: 'judge',
    message,
    phase: context.phase,
    action: 'request_user_input',
    allowUserInput: true,
    userInputType: 'response',
    userOptions: {
      speak: `${personName} Speaks Up`,
      continue: 'Proceed Without Further Input',
    },
    messageDuration: 3000,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 70,
      tone: 'calm',
    },
  }
}

async function generatePhaseAdvanceResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  const phases = {
    'opening_statements': 'Moving to Lawyer Reframing...',
    'lawyer_reframing': 'The cross-examination begins...',
    'cross_examination': 'Now, we delve deeper into the emotional core...',
    'emotional_clarification': 'Final arguments. Make them count.',
    'final_arguments': 'The verdict approaches...',
  } as Record<string, string>

  const nextPhaseMessage = phases[context.phase] || 'Proceeding...'

  return {
    speaker: 'judge',
    message: `${nextPhaseMessage}`,
    phase: context.phase,
    action: 'advance_phase',
    allowUserInput: false,
    messageDuration: 2000,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 60,
      tone: 'calm',
    },
  }
}

async function generateVerdictResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  let message = `After careful consideration of all evidence, contradictions, and emotional contexts, this court renders its verdict...`

  try {
    message = await generateCourtMessage({
      speaker: 'judge',
      phase: context.phase,
      memory,
      mood: context.mood,
      action: 'deliver_verdict',
    })
  } catch (error) {
    console.error('Failed to generate verdict:', error)
  }

  return {
    speaker: 'judge',
    message,
    phase: context.phase,
    action: 'deliver_verdict',
    allowUserInput: false,
    messageDuration: 4000,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 100,
      tone: 'calm',
    },
  }
}
