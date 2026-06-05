/**
 * JUDGE-CENTRIC INVESTIGATION ORCHESTRATOR
 * 
 * The judge is the intelligent core:
 * - Controls conversation flow
 * - Decides who speaks next
 * - Investigates contradictions
 * - Determines when verdict is ready
 * 
 * This is NOT roleplay orchestration.
 * This is investigation direction.
 */

import { CourtInvestigationState, CourtMessage, JudgeConfidence } from '@/types/courtroom'
import {
  getUnresolvedIssuesSummary,
  updateJudgeConfidence,
  recordMessage,
} from '@/utils/investigationMemory'
import {
  generateNextBestQuestion,
  generateJudgeObservation,
  generateFollowUpQuestion,
} from '@/utils/targetedQuestionEngine'

/**
 * Judge analyzes current state and determines next action
 * Returns structured response that drives frontend behavior
 */
export async function judgeAnalyzeAndRespond(
  state: CourtInvestigationState
): Promise<CourtMessage> {
  // Step 1: Judge assesses current investigation state
  const assessment = assessInvestigationState(state)

  // Step 2: Judge decides if verdict is ready
  if (assessment.readyForVerdict) {
    return await generateVerdict(state)
  }

  // Step 3: Judge determines next investigation step
  const nextAction = determineNextInvestigationStep(state, assessment)

  // Step 4: Judge acts based on decision
  switch (nextAction.type) {
    case 'ask_targeted_question':
      return generateTargetedQuestionMessage(state, nextAction)

    case 'challenge_contradiction':
      return generateContradictionChallenge(state, nextAction)

    case 'explore_emotional':
      return generateEmotionalExploration(state, nextAction)

    case 'probe_timeline':
      return generateTimelineProbe(state, nextAction)

    case 'observation':
      return generateJudgeObservationMessage(state)

    case 'transition_phase':
      return generatePhaseTransition(state, nextAction)

    case 'request_response':
      return generateResponseRequest(state, nextAction)

    default:
      return generateDefaultResponse(state)
  }
}

interface AssessmentResult {
  contradictionsCount: number
  unresolved: string[]
  emotionalConcerns: string[]
  clarityScore: number
  readyForVerdict: boolean
  priority: string
}

/**
 * Judge assesses current investigation state
 */
function assessInvestigationState(state: CourtInvestigationState): AssessmentResult {
  const issues = getUnresolvedIssuesSummary(state.caseAnchor)
  const clarity = calculateClarityScore(state)

  const readyForVerdict =
    state.caseAnchor.contradictions.filter(c => c.severity !== 'resolved').length <= 1 &&
    state.investigation.phase === 'emotional_clarification' &&
    clarity >= 70

  let priority = 'continue_investigation'
  if (state.caseAnchor.contradictions.some(c => c.severity === 'severe')) {
    priority = 'address_severe_contradiction'
  } else if (state.caseAnchor.emotionalContext.intensity > 70) {
    priority = 'explore_emotional_core'
  }

  return {
    contradictionsCount: state.caseAnchor.contradictions.length,
    unresolved: issues.unresolvedQuestions,
    emotionalConcerns: issues.emotionalConcerns,
    clarityScore: clarity,
    readyForVerdict,
    priority,
  }
}

/**
 * Calculate clarity score (0-100) based on investigation progress
 */
function calculateClarityScore(state: CourtInvestigationState): number {
  let score = 20 // Starting baseline

  // Add points for resolved contradictions
  const resolvedCount = state.caseAnchor.contradictions.filter(
    c => c.severity === 'resolved'
  ).length
  score += resolvedCount * 15

  // Add points for resolved questions
  const resolvedQuestions = state.caseAnchor.unresolvedQuestions.filter(
    q => q.status === 'resolved'
  ).length
  score += resolvedQuestions * 10

  // Add points for established facts
  score += Math.min(state.caseAnchor.importantFacts.length * 5, 20)

  // Add points for emotional clarity
  if (state.caseAnchor.emotionalContext.primaryEmotion !== 'unknown') {
    score += 15
  }

  return Math.min(score, 100)
}

interface InvestigationAction {
  type:
    | 'ask_targeted_question'
    | 'challenge_contradiction'
    | 'explore_emotional'
    | 'probe_timeline'
    | 'observation'
    | 'transition_phase'
    | 'request_response'
  target?: 'personA' | 'personB'
  data?: any
}

/**
 * Judge determines next investigation step
 */
function determineNextInvestigationStep(
  state: CourtInvestigationState,
  assessment: AssessmentResult
): InvestigationAction {
  // Priority 1: Address severe contradictions
  const severeContradictions = state.caseAnchor.contradictions.filter(
    c => c.severity === 'severe'
  )
  if (severeContradictions.length > 0) {
    const contradiction = severeContradictions[0]
    return {
      type: 'challenge_contradiction',
      target: contradiction.speakers[0] === state.caseData.personAName ? 'personA' : 'personB',
      data: contradiction,
    }
  }

  // Priority 2: Explore emotional core
  if (state.caseAnchor.emotionalContext.intensity > 70) {
    return {
      type: 'explore_emotional',
      target: 'personA',
    }
  }

  // Priority 3: Probe timeline issues
  if (state.caseAnchor.timelineIssues.length > 0) {
    return {
      type: 'probe_timeline',
      data: state.caseAnchor.timelineIssues[0],
    }
  }

  // Priority 4: Ask best targeted question
  const question = generateNextBestQuestion({
    personAName: state.caseData.personAName,
    personBName: state.caseData.personBName,
    personAStatement: state.caseData.personAStatement,
    personBStatement: state.caseData.personBStatement,
    recentMessages: state.messages.slice(-5).map(m => m.content),
    caseAnchor: state.caseAnchor,
    judgeMemory: state.judgeMemory,
  })

  if (question) {
    return {
      type: 'ask_targeted_question',
      target: question.target === 'personA' ? 'personA' : 'personB',
      data: question,
    }
  }

  // Fallback: Judge observation
  return {
    type: 'observation',
  }
}

/**
 * Generate targeted question message
 */
function generateTargetedQuestionMessage(
  state: CourtInvestigationState,
  action: InvestigationAction
): CourtMessage {
  const question = action.data

  return {
    speaker: 'judge',
    message: question.question,
    messageType: 'question',
    nextTarget: action.target,
    requiresUserResponse: true,
    question: question.question,
    courtroomPhase: state.investigation.phase,
    allowUserInput: true,
    emotional: {
      intensity: 60,
      tone: 'investigative',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 3500,
  }
}

/**
 * Generate contradiction challenge
 */
function generateContradictionChallenge(
  state: CourtInvestigationState,
  action: InvestigationAction
): CourtMessage {
  const contradiction = action.data
  const speaker = action.target === 'personA' ? state.caseData.personAName : state.caseData.personBName

  return {
    speaker: 'judge',
    message: `The court has identified a critical inconsistency in ${speaker}'s testimony. ${contradiction.statement} contradicts ${contradiction.contradiction}. ${speaker}, please explain this discrepancy.`,
    messageType: 'question',
    nextTarget: action.target,
    requiresUserResponse: true,
    contradictionDetected: true,
    addressedContradiction: contradiction.contradiction,
    courtroomPhase: state.investigation.phase,
    allowUserInput: true,
    emotional: {
      intensity: 75,
      tone: 'challenging',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 4000,
  }
}

/**
 * Generate emotional exploration
 */
function generateEmotionalExploration(
  state: CourtInvestigationState,
  action: InvestigationAction
): CourtMessage {
  const personName =
    action.target === 'personA' ? state.caseData.personAName : state.caseData.personBName
  const emotion = state.caseAnchor.emotionalContext.primaryEmotion

  return {
    speaker: 'judge',
    message: `The court recognizes significant emotion around this issue. ${personName}, beyond the facts, help the court understand: What does this situation mean to you emotionally? What are you most concerned about losing or not being understood?`,
    messageType: 'question',
    nextTarget: action.target,
    requiresUserResponse: true,
    courtroomPhase: 'emotional_clarification',
    allowUserInput: true,
    emotional: {
      intensity: 70,
      tone: 'empathetic',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 4500,
  }
}

/**
 * Generate timeline probe
 */
function generateTimelineProbe(
  state: CourtInvestigationState,
  action: InvestigationAction
): CourtMessage {
  const issue = action.data

  return {
    speaker: 'judge',
    message: `The court has identified a timeline concern regarding "${issue.event}". The stated time was "${issue.claimedTime}", but this conflicts with other information. Please clarify the accurate sequence of events.`,
    messageType: 'question',
    requiresUserResponse: true,
    courtroomPhase: state.investigation.phase,
    allowUserInput: true,
    emotional: {
      intensity: 65,
      tone: 'investigative',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 3800,
  }
}

/**
 * Generate judge observation
 */
function generateJudgeObservationMessage(state: CourtInvestigationState): CourtMessage {
  const observation = generateJudgeObservation({
    personAName: state.caseData.personAName,
    personBName: state.caseData.personBName,
    personAStatement: state.caseData.personAStatement,
    personBStatement: state.caseData.personBStatement,
    recentMessages: state.messages.slice(-5).map(m => m.content),
    caseAnchor: state.caseAnchor,
    judgeMemory: state.judgeMemory,
  })

  return {
    speaker: 'judge',
    message: observation,
    messageType: 'observation',
    requiresUserResponse: false,
    courtroomPhase: state.investigation.phase,
    allowUserInput: false,
    emotional: {
      intensity: 50,
      tone: 'neutral',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 2500,
  }
}

/**
 * Generate phase transition message
 */
function generatePhaseTransition(
  state: CourtInvestigationState,
  action: InvestigationAction
): CourtMessage {
  const phaseMessages: Record<string, string> = {
    investigation:
      'The court moves into deeper investigation. We need to understand the emotional dimensions of this dispute.',
    deep_investigation:
      'The investigation deepens. The court is looking for not just facts, but the human truth.',
    emotional_clarification:
      'We now focus on the emotional core of this conflict. Understanding feeling is as important as understanding fact.',
    verdict: 'The court has sufficient information. A verdict will now be rendered.',
  }

  return {
    speaker: 'judge',
    message: phaseMessages[action.data?.phase] || 'The court proceeds to the next phase.',
    messageType: 'observation',
    requiresUserResponse: false,
    courtroomPhase: state.investigation.phase,
    allowUserInput: false,
    emotional: {
      intensity: 60,
      tone: 'neutral',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 2500,
  }
}

/**
 * Generate response request (allows user to respond)
 */
function generateResponseRequest(
  state: CourtInvestigationState,
  action: InvestigationAction
): CourtMessage {
  return {
    speaker: 'judge',
    message: `${action.target === 'personA' ? state.caseData.personAName : state.caseData.personBName}, you may respond.`,
    messageType: 'observation',
    nextTarget: action.target,
    requiresUserResponse: true,
    courtroomPhase: state.investigation.phase,
    allowUserInput: true,
    emotional: {
      intensity: 40,
      tone: 'neutral',
    },
    judgeConfidence: state.judgeConfidence,
    messageDuration: 1500,
  }
}

/**
 * Generate verdict
 */
async function generateVerdict(state: CourtInvestigationState): Promise<CourtMessage> {
  // In final implementation, this would call AI to generate verdict
  // For now, placeholder

  return {
    speaker: 'judge',
    message: `After careful investigation of the evidence, emotional context, and testimony, the court renders its verdict...`,
    messageType: 'verdict',
    requiresUserResponse: false,
    courtroomPhase: 'verdict',
    allowUserInput: false,
    emotional: {
      intensity: 85,
      tone: 'neutral',
    },
    judgeConfidence: state.judgeConfidence,
    hasTyping: true,
    messageDuration: 3000,
  }
}

/**
 * Default response if no specific action matches
 */
function generateDefaultResponse(state: CourtInvestigationState): CourtMessage {
  return {
    speaker: 'judge',
    message: 'The court is listening. Please continue.',
    messageType: 'observation',
    requiresUserResponse: false,
    courtroomPhase: state.investigation.phase,
    allowUserInput: false,
    emotional: {
      intensity: 40,
      tone: 'neutral',
    },
    judgeConfidence: state.judgeConfidence,
  }
}
