/**
 * JUDGE CONFIDENCE SYSTEM
 * 
 * Tracks the judge's internal understanding and certainty.
 * Determines when verdict is ready.
 * Drives investigation pacing dynamically.
 */

import { CaseAnchor, getUnresolvedSummary } from './caseAnchor'

export interface JudgeConfidence {
  // Overall confidence (0-100)
  overall: number
  
  // Sub-metrics
  clarityLevel: number // How clear is the truth? (0-100)
  emotionalUnderstanding: number // Does judge understand emotional core? (0-100)
  contradictionsResolved: number // Count of resolved contradictions
  contradictionsRemaining: number // Count of unresolved
  factsEstablished: number // Count of established facts
  
  // Readiness
  readyForVerdict: boolean
  verdictThreshold: number // Usually 75
  
  // Reasoning (for transparency)
  reasoning: string[]
  
  // Metadata
  lastUpdated: number
  confidenceHistory: Array<{
    timestamp: number
    overall: number
    phase: string
  }>
}

/**
 * Initialize judge confidence
 */
export function initializeJudgeConfidence(): JudgeConfidence {
  return {
    overall: 20, // Start low, build through investigation
    clarityLevel: 20,
    emotionalUnderstanding: 0,
    contradictionsResolved: 0,
    contradictionsRemaining: 0,
    factsEstablished: 0,
    readyForVerdict: false,
    verdictThreshold: 75,
    reasoning: ['Investigation beginning'],
    lastUpdated: Date.now(),
    confidenceHistory: [
      {
        timestamp: Date.now(),
        overall: 20,
        phase: 'opening',
      },
    ],
  }
}

/**
 * Calculate judge confidence based on case anchor progress
 */
export function calculateJudgeConfidence(
  anchor: CaseAnchor,
  turnCount: number,
  investigationPhase: string
): JudgeConfidence {
  const unresolved = getUnresolvedSummary(anchor)

  // Start with base score
  let clarityScore = 20

  // Add points for resolved contradictions
  const totalContradictions = anchor.contradictions.length
  const resolvedCount = anchor.contradictions.filter(c => c.resolved).length
  if (totalContradictions > 0) {
    clarityScore += (resolvedCount / totalContradictions) * 30
  }

  // Add points for answered questions
  const totalQuestions = anchor.unresolvedQuestions.length
  const answeredCount = anchor.unresolvedQuestions.filter(
    q => q.status === 'resolved'
  ).length
  if (totalQuestions > 0) {
    clarityScore += (answeredCount / totalQuestions) * 25
  }

  // Add points for established facts
  clarityScore += Math.min(anchor.establishedFacts.length * 5, 15)

  // Add points for emotional understanding
  let emotionalScore = 0
  if (anchor.primaryEmotion !== 'unknown') {
    emotionalScore += 20
  }
  if (anchor.emotionalConcerns.length > 0) {
    emotionalScore += anchor.emotionalConcerns.filter(c => c.addressed).length * 10
  }

  // Cap scores at 100
  const clarityLevel = Math.min(clarityScore, 100)
  const emotionalUnderstanding = Math.min(emotionalScore, 100)

  // Overall = average of clarity and emotional understanding
  const overall = Math.round((clarityLevel + emotionalUnderstanding) / 2)

  // Determine if ready for verdict
  const readyForVerdict =
    overall >= 75 &&
    unresolved.unresolved.contradictions <= 1 &&
    unresolved.unresolved.questions <= 1 &&
    investigationPhase === 'emotional_clarification'

  // Build reasoning
  const reasoning: string[] = []

  if (resolvedCount > 0) {
    reasoning.push(`${resolvedCount}/${totalContradictions} contradictions resolved`)
  }
  if (answeredCount > 0) {
    reasoning.push(`${answeredCount}/${totalQuestions} key questions answered`)
  }
  if (anchor.establishedFacts.length > 0) {
    reasoning.push(`${anchor.establishedFacts.length} facts established`)
  }
  if (anchor.emotionalConcerns.filter(c => c.addressed).length > 0) {
    reasoning.push(`Emotional core understood`)
  }

  if (readyForVerdict) {
    reasoning.push('✓ Sufficient clarity for verdict')
  } else {
    const gaps = []
    if (unresolved.unresolved.contradictions > 1) {
      gaps.push(`${unresolved.unresolved.contradictions} contradictions remain`)
    }
    if (unresolved.unresolved.questions > 1) {
      gaps.push(`${unresolved.unresolved.questions} questions remain`)
    }
    if (overall < 75) {
      gaps.push(`Clarity at ${overall}% (need 75%)`)
    }
    if (gaps.length > 0) {
      reasoning.push(`Continue investigation: ${gaps.join(', ')}`)
    }
  }

  return {
    overall,
    clarityLevel,
    emotionalUnderstanding,
    contradictionsResolved: resolvedCount,
    contradictionsRemaining: unresolved.unresolved.contradictions,
    factsEstablished: anchor.establishedFacts.length,
    readyForVerdict,
    verdictThreshold: 75,
    reasoning,
    lastUpdated: Date.now(),
    confidenceHistory: [
      {
        timestamp: Date.now(),
        overall,
        phase: investigationPhase,
      },
    ],
  }
}

/**
 * Determine what judge should investigate next
 */
export function determineNextInvestigationPriority(
  anchor: CaseAnchor,
  confidence: JudgeConfidence
): {
  priority: 'contradiction' | 'question' | 'emotional' | 'timeline' | 'verdict'
  target: 'personA' | 'personB' | null
  detail: string
} {
  // Priority 1: Severe unresolved contradictions
  const severeContradictions = anchor.contradictions.filter(
    c => c.severity === 'severe' && !c.resolved
  )
  if (severeContradictions.length > 0) {
    return {
      priority: 'contradiction',
      target: severeContradictions[0].speaker,
      detail: severeContradictions[0].contradictingClaim,
    }
  }

  // Priority 2: Unresolved questions
  const unaskedQuestions = anchor.unresolvedQuestions.filter(
    q => q.status === 'asked' && !q.answer
  )
  if (unaskedQuestions.length > 0) {
    return {
      priority: 'question',
      target: unaskedQuestions[0].targetedAt,
      detail: unaskedQuestions[0].question,
    }
  }

  // Priority 3: Emotional understanding
  const unaddressedEmotional = anchor.emotionalConcerns.filter(c => !c.addressed)
  if (unaddressedEmotional.length > 0) {
    return {
      priority: 'emotional',
      target: unaddressedEmotional[0].affectedParty as 'personA' | 'personB' | null,
      detail: unaddressedEmotional[0].concern,
    }
  }

  // Priority 4: Timeline issues
  const unresolvedTimeline = anchor.timelineIssues.filter(t => !t.resolved)
  if (unresolvedTimeline.length > 0) {
    return {
      priority: 'timeline',
      target: unresolvedTimeline[0].claimedBy,
      detail: unresolvedTimeline[0].event,
    }
  }

  // Ready for verdict
  return {
    priority: 'verdict',
    target: null,
    detail: 'All investigation complete',
  }
}

/**
 * Get human-readable confidence assessment
 */
export function getConfidenceAssessment(confidence: JudgeConfidence): string {
  if (confidence.readyForVerdict) {
    return `Judge is ${confidence.overall}% confident. Ready to deliver verdict.`
  }

  return `Judge is ${confidence.overall}% confident. Continue investigation: ${confidence.reasoning.join('; ')}`
}
