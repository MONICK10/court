/**
 * JUDGE ORCHESTRATOR - CORE SYSTEM
 * 
 * The judge is the intelligent director of the investigation.
 * 
 * Decision flow:
 * 1. Assess current investigation state
 * 2. Calculate judge confidence
 * 3. Determine if verdict is ready
 * 4. If not, decide next investigation step
 * 5. Generate contextual response
 */

import { CaseSetup } from '@/types'
import { CaseAnchor, initializeCaseAnchor, getCaseAnchorContext } from './caseAnchor'
import {
  JudgeConfidence,
  initializeJudgeConfidence,
  calculateJudgeConfidence,
  determineNextInvestigationPriority,
} from './judgeConfidence'
import {
  generateBestNextQuestion,
  TargetedQuestion,
  isGenericFiller,
  isAnchored,
} from './targetedQuestions'

/**
 * Courtroom state maintained across turns
 */
export interface CourtState {
  caseSetup: CaseSetup
  caseAnchor: CaseAnchor
  judgeConfidence: JudgeConfidence
  
  // Conversation history
  messages: Array<{
    speaker: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'
    content: string
    turnNumber: number
    timestamp: number
  }>
  
  // Participation tracking
  userParticipation: {
    personA: {
      count: number
      lastTurnIndex: number
      statements: string[]
    }
    personB: {
      count: number
      lastTurnIndex: number
      statements: string[]
    }
  }
  
  // Investigation tracking
  investigationPhase: 'opening' | 'investigation' | 'deep_investigation' | 'emotional_clarification' | 'verdict'
  turnCount: number
  createdAt: number
  lastUpdated: number
}

/**
 * Judge's response to the courtroom
 */
export interface JudgeResponse {
  // What the judge says/does
  speaker: 'judge'
  message: string
  messageType: 'statement' | 'question' | 'observation' | 'challenge' | 'verdict'
  
  // Investigation context
  reasoning: string // Why judge made this decision
  contradictionAddressed?: string
  
  // Next action control
  nextTarget?: 'userA' | 'userB' | 'lawyerA' | 'lawyerB' | null
  requiresUserResponse: boolean
  question?: TargetedQuestion
  
  // State updates
  newPhase?: string
  confidenceUpdate: JudgeConfidence
  
  // UI choreography
  intensity: number // 0-100
  tone: 'investigative' | 'empathetic' | 'challenging' | 'analytical'
  messageDuration?: number // ms
  hasTyping?: boolean
  emphasis?: boolean
}

/**
 * Initialize court state from case setup
 */
export function initializeCourtState(caseSetup: CaseSetup): CourtState {
  return {
    caseSetup,
    caseAnchor: initializeCaseAnchor(caseSetup),
    judgeConfidence: initializeJudgeConfidence(),
    messages: [],
    userParticipation: {
      personA: { count: 0, lastTurnIndex: -1, statements: [] },
      personB: { count: 0, lastTurnIndex: -1, statements: [] },
    },
    investigationPhase: 'opening',
    turnCount: 0,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  }
}

/**
 * Main orchestration function
 * Called after each user input or after judge needs to act
 */
export async function judgeOrchestrate(
  state: CourtState,
  userInputIfAny?: {
    speaker: 'userA' | 'userB'
    content: string
  }
): Promise<JudgeResponse> {
  let updatedState = { ...state }
  updatedState.turnCount += 1
  updatedState.lastUpdated = Date.now()

  // Step 1: Record user input if provided
  if (userInputIfAny) {
    updatedState = recordUserInput(updatedState, userInputIfAny)
  }

  // Step 2: Update judge confidence based on current state
  updatedState.judgeConfidence = calculateJudgeConfidence(
    updatedState.caseAnchor,
    updatedState.turnCount,
    updatedState.investigationPhase
  )

  // Step 3: Check if verdict is ready
  if (updatedState.judgeConfidence.readyForVerdict) {
    return generateVerdictResponse(updatedState)
  }

  // Step 4: Determine next investigation step
  const priority = determineNextInvestigationPriority(
    updatedState.caseAnchor,
    updatedState.judgeConfidence
  )

  // Step 5: Generate appropriate judge response
  let response: JudgeResponse

  switch (priority.priority) {
    case 'contradiction':
      response = generateContradictionChallengeResponse(updatedState, priority.target)
      break

    case 'question':
      response = generateClarificationResponse(updatedState, priority.target)
      break

    case 'emotional':
      response = generateEmotionalExplorationResponse(updatedState, priority.target)
      break

    case 'timeline':
      response = generateTimelineProbeResponse(updatedState, priority.target)
      break

    case 'verdict':
      response = generateVerdictResponse(updatedState)
      break

    default:
      response = generateContinuationResponse(updatedState)
  }

  response.confidenceUpdate = updatedState.judgeConfidence

  return response
}

/**
 * Record user input in court state
 */
function recordUserInput(
  state: CourtState,
  input: { speaker: 'userA' | 'userB'; content: string }
): CourtState {
  const speaker = input.speaker === 'userA' ? 'personA' : 'personB'
  const key = speaker === 'personA' ? 'personA' : 'personB'

  return {
    ...state,
    messages: [
      ...state.messages,
      {
        speaker: input.speaker,
        content: input.content,
        turnNumber: state.turnCount,
        timestamp: Date.now(),
      },
    ],
    userParticipation: {
      ...state.userParticipation,
      [key]: {
        ...state.userParticipation[key],
        count: state.userParticipation[key].count + 1,
        lastTurnIndex: state.messages.length,
        statements: [...state.userParticipation[key].statements, input.content],
      },
    },
  }
}

/**
 * Generate response to contradiction
 */
function generateContradictionChallengeResponse(
  state: CourtState,
  target: 'personA' | 'personB' | null
): JudgeResponse {
  const contradiction = state.caseAnchor.contradictions.find(c => !c.resolved)

  if (!contradiction || !target) {
    return generateContinuationResponse(state)
  }

  const personName =
    target === 'personA'
      ? state.caseSetup.personAName
      : state.caseSetup.personBName

  const message = `I must address a significant inconsistency. You stated "${contradiction.claim}", yet the evidence shows "${contradiction.contradictingClaim}". ${personName}, how do you reconcile this?`

  return {
    speaker: 'judge',
    message,
    messageType: 'challenge',
    reasoning: `Direct contradiction requires clarification`,
    contradictionAddressed: contradiction.id,
    nextTarget: target === 'personA' ? 'userA' : 'userB',
    requiresUserResponse: true,
    intensity: 85,
    tone: 'challenging',
    hasTyping: true,
    emphasis: true,
    confidenceUpdate: state.judgeConfidence,
  }
}

/**
 * Generate response asking for clarification
 */
function generateClarificationResponse(
  state: CourtState,
  target: 'personA' | 'personB' | null
): JudgeResponse {
  if (!target) {
    return generateContinuationResponse(state)
  }

  const question = generateBestNextQuestion(state.caseAnchor)
  const personName =
    target === 'personA'
      ? state.caseSetup.personAName
      : state.caseSetup.personBName

  const message = `${personName}, ${question.question}`

  return {
    speaker: 'judge',
    message,
    messageType: 'question',
    reasoning: question.rationale,
    question,
    nextTarget: target === 'personA' ? 'userA' : 'userB',
    requiresUserResponse: true,
    intensity: 70,
    tone: 'investigative',
    hasTyping: true,
    confidenceUpdate: state.judgeConfidence,
  }
}

/**
 * Generate emotional exploration response
 */
function generateEmotionalExplorationResponse(
  state: CourtState,
  target: 'personA' | 'personB' | null
): JudgeResponse {
  if (!target) {
    return generateContinuationResponse(state)
  }

  const personName =
    target === 'personA'
      ? state.caseSetup.personAName
      : state.caseSetup.personBName
  const emotion = state.caseAnchor.primaryEmotion

  const message = `${personName}, beneath the details, I sense ${emotion}. Can you describe what you're truly feeling in this situation? When did this start?`

  return {
    speaker: 'judge',
    message,
    messageType: 'question',
    reasoning: `Explore emotional core to understand true conflict`,
    nextTarget: target === 'personA' ? 'userA' : 'userB',
    requiresUserResponse: true,
    intensity: 60,
    tone: 'empathetic',
    hasTyping: true,
    confidenceUpdate: state.judgeConfidence,
  }
}

/**
 * Generate timeline probe response
 */
function generateTimelineProbeResponse(
  state: CourtState,
  target: 'personA' | 'personB' | null
): JudgeResponse {
  if (!target) {
    return generateContinuationResponse(state)
  }

  const timeline = state.caseAnchor.timelineIssues[0]
  const personName =
    target === 'personA'
      ? state.caseSetup.personAName
      : state.caseSetup.personBName

  const message = timeline
    ? `${personName}, you claim "${timeline.event}" occurred at "${timeline.claimedTime}". I have information suggesting otherwise. Help me understand the discrepancy.`
    : `Let's establish a clear timeline. ${personName}, walk me through the sequence of events.`

  return {
    speaker: 'judge',
    message,
    messageType: 'question',
    reasoning: `Timeline inconsistencies often reveal truth`,
    nextTarget: target === 'personA' ? 'userA' : 'userB',
    requiresUserResponse: true,
    intensity: 75,
    tone: 'analytical',
    hasTyping: true,
    confidenceUpdate: state.judgeConfidence,
  }
}

/**
 * Generate verdict response
 */
function generateVerdictResponse(state: CourtState): JudgeResponse {
  // Build verdict based on investigation
  const verdict = buildVerdict(state)

  return {
    speaker: 'judge',
    message: verdict.message,
    messageType: 'verdict',
    reasoning: `Investigation complete. Sufficient clarity for verdict.`,
    intensity: 90,
    tone: 'analytical',
    hasTyping: true,
    emphasis: true,
    confidenceUpdate: state.judgeConfidence,
    nextTarget: null,
    requiresUserResponse: false,
  }
}

/**
 * Generate continuation response (generic advancement)
 */
function generateContinuationResponse(state: CourtState): JudgeResponse {
  return {
    speaker: 'judge',
    message: `The court notes this perspective. Let us continue the investigation.`,
    messageType: 'statement',
    reasoning: `Advance to next phase`,
    intensity: 50,
    tone: 'analytical',
    confidenceUpdate: state.judgeConfidence,
    nextTarget: null,
    requiresUserResponse: false,
  }
}

/**
 * Build verdict message from investigation state
 */
function buildVerdict(state: CourtState): { message: string } {
  const resolved = state.caseAnchor.contradictions.filter(c => c.resolved).length
  const total = state.caseAnchor.contradictions.length

  return {
    message: `After thorough investigation, the court finds: [Verdict based on investigation]`,
  }
}
