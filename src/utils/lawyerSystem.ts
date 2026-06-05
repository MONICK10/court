/**
 * LAWYER RESPONSE SYSTEM - INVESTIGATION MODEL
 * 
 * Lawyers are STRATEGIC, not theatrical.
 * - 1-3 sentences maximum
 * - Always anchored to actual case
 * - Only respond to judge questions/requests
 * - Defend clients strategically
 * - Challenge contradictions if beneficial
 * - Reference actual facts and statements
 * - NO generic filler or cinematic speeches
 */

import { CourtInvestigationState } from '@/types/courtroom'

export type LawyerSide = 'A' | 'B'

/**
 * Generate lawyer response to judge question/situation
 * Only called when judge specifically requests lawyer response
 */
export async function generateLawyerResponse(
  lawyerSide: LawyerSide,
  state: CourtInvestigationState,
  triggeringQuestion?: string
): Promise<string> {
  const isClientA = lawyerSide === 'A'
  const clientName = isClientA ? state.caseData.personAName : state.caseData.personBName
  const clientStatement = isClientA ? state.caseData.personAStatement : state.caseData.personBStatement

  // Determine lawyer strategy based on judge's question
  if (triggeringQuestion) {
    return generateResponseToQuestion(
      lawyerSide,
      triggeringQuestion,
      clientName,
      clientStatement,
      state
    )
  }

  // Default: brief statement defending client position
  return `My client's position remains consistent with their original statement. The evidence supports their account.`
}

/**
 * Generate lawyer response to specific judge question
 */
function generateResponseToQuestion(
  lawyerSide: LawyerSide,
  question: string,
  clientName: string,
  clientStatement: string,
  state: CourtInvestigationState
): string {
  const isClientA = lawyerSide === 'A'
  const opposingName = isClientA ? state.caseData.personBName : state.caseData.personAName

  // Pattern 1: Judge asks about contradiction
  if (
    question.toLowerCase().includes('contradiction') ||
    question.toLowerCase().includes('inconsistent')
  ) {
    return `Your Honor, my client's statement has been consistent. What may appear inconsistent reflects the complexity of the situation and the passage of time.`
  }

  // Pattern 2: Judge asks about timeline
  if (
    question.toLowerCase().includes('timeline') ||
    question.toLowerCase().includes('when') ||
    question.toLowerCase().includes('time')
  ) {
    return `The sequence of events is clear in my client's recollection. The precise timing, while meaningful, is secondary to the order and impact of what occurred.`
  }

  // Pattern 3: Judge asks about emotional intent
  if (
    question.toLowerCase().includes('emotion') ||
    question.toLowerCase().includes('mean') ||
    question.toLowerCase().includes('feel')
  ) {
    return `My client's emotional experience was genuine. The impact was real, regardless of the other party's intent.`
  }

  // Pattern 4: Judge challenges client credibility
  if (
    question.toLowerCase().includes('credibility') ||
    question.toLowerCase().includes('truthfulness') ||
    question.toLowerCase().includes('honest')
  ) {
    return `My client has been forthright throughout. Any apparent discrepancies stem from the complexity of events, not from dishonesty.`
  }

  // Default response to generic question
  return `Your Honor, I defer to my client's direct response on this matter.`
}

/**
 * Generate opening statement for lawyer (very brief, factual)
 */
export function generateOpeningStatement(
  lawyerSide: LawyerSide,
  state: CourtInvestigationState
): string {
  const isClientA = lawyerSide === 'A'
  const clientName = isClientA ? state.caseData.personAName : state.caseData.personBName
  const coreConflict = state.caseAnchor.coreConflict

  return `Your Honor, I represent ${clientName}. The facts demonstrate that my client's position on ${coreConflict} is grounded in truth.`
}

/**
 * Generate closing statement for lawyer (before verdict)
 */
export function generateClosingStatement(
  lawyerSide: LawyerSide,
  state: CourtInvestigationState
): string {
  const isClientA = lawyerSide === 'A'
  const clientName = isClientA ? state.caseData.personAName : state.caseData.personBName

  return `Your Honor, the evidence supports my client's account. I respectfully ask that the court recognize the honesty and reasonableness of ${clientName}'s actions.`
}
