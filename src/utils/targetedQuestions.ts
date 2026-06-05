/**
 * TARGETED QUESTIONING ENGINE
 * 
 * Judge asks intelligent, contextual questions.
 * Every question references actual conflict, contradictions, or emotional issues.
 * 
 * NOT: Generic courtroom filler
 * YES: Specific, high-pressure investigation
 */

import { CaseAnchor } from './caseAnchor'

export interface TargetedQuestion {
  question: string
  targets: 'personA' | 'personB'
  rationale: string // Why this question matters
  expectedToReveal: string // What truth this might expose
  intensity: 'gentle' | 'moderate' | 'direct' | 'confrontational'
}

/**
 * Generate a targeted question to challenge a contradiction
 */
export function generateContradictionChallenge(
  anchor: CaseAnchor,
  contradictionIndex: number,
  personName: string
): TargetedQuestion {
  const contradiction = anchor.contradictions[contradictionIndex]

  if (!contradiction || contradiction.resolved) {
    return generateEmotionalDeepDive(anchor, 'personA')
  }

  const isPersonA = anchor.contradictions.findIndex(c => c.id === contradiction.id) >= 0

  return {
    question: `You said "${contradiction.claim}", but the evidence shows "${contradiction.contradictingClaim}". How do you reconcile this discrepancy?`,
    targets: contradiction.speaker,
    rationale: `Direct contradiction on core claim`,
    expectedToReveal: `Whether claim was false, misremembered, or contextual`,
    intensity: 'confrontational',
  }
}

/**
 * Generate a question targeting timeline inconsistencies
 */
export function generateTimelineQuestion(
  anchor: CaseAnchor,
  timelineIndex: number
): TargetedQuestion {
  const timeline = anchor.timelineIssues[timelineIndex]

  if (!timeline) {
    return generateEmotionalDeepDive(anchor, 'personA')
  }

  return {
    question: `You claim "${timeline.event}" happened at "${timeline.claimedTime}". Yet, we have evidence placing you elsewhere. Can you explain this?`,
    targets: timeline.claimedBy,
    rationale: `Timeline inconsistency undermines credibility`,
    expectedToReveal: `Awareness of contradiction, honesty, or hidden activity`,
    intensity: 'direct',
  }
}

/**
 * Generate a question probing emotional claim
 */
export function generateEmotionalQuestion(
  anchor: CaseAnchor,
  personTarget: 'personA' | 'personB'
): TargetedQuestion {
  const emotionalConcerns = anchor.emotionalConcerns.filter(
    c => c.affectedParty === personTarget || c.affectedParty === 'both'
  )

  if (emotionalConcerns.length === 0) {
    return {
      question: `How would you describe your emotional state regarding this situation?`,
      targets: personTarget,
      rationale: `Establish emotional baseline`,
      expectedToReveal: `Primary emotional concern`,
      intensity: 'gentle',
    }
  }

  const concern = emotionalConcerns[0]

  return {
    question: `You mentioned feeling ${concern.concern}. Can you describe a specific moment when you felt this way?`,
    targets: personTarget,
    rationale: `Anchor emotional claim to concrete evidence`,
    expectedToReveal: `Depth of emotional experience`,
    intensity: 'moderate',
  }
}

/**
 * Generate a deep-dive emotional question
 */
export function generateEmotionalDeepDive(
  anchor: CaseAnchor,
  personTarget: 'personA' | 'personB'
): TargetedQuestion {
  const emotionalConcerns = anchor.emotionalConcerns.filter(
    c => c.affectedParty === personTarget || c.affectedParty === 'both'
  )

  if (emotionalConcerns.length === 0) {
    return {
      question: `What is the one thing you wish the other person understood about your perspective?`,
      targets: personTarget,
      rationale: `Access emotional core`,
      expectedToReveal: `True emotional need`,
      intensity: 'gentle',
    }
  }

  const concern = emotionalConcerns[0]

  return {
    question: `When did you first realize that ${concern.concern}? What was happening at that moment?`,
    targets: personTarget,
    rationale: `Pinpoint emotional origin`,
    expectedToReveal: `Root cause of emotional breakdown`,
    intensity: 'moderate',
  }
}

/**
 * Generate a contradiction-revelation question
 * Reveals contradiction that person may not have realized
 */
export function generateContradictionRevealQuestion(
  anchor: CaseAnchor,
  personTarget: 'personA' | 'personB'
): TargetedQuestion {
  const selfContradictions = anchor.contradictions.filter(c => c.speaker === personTarget)

  if (selfContradictions.length === 0) {
    return generateEmotionalDeepDive(anchor, personTarget)
  }

  const contradiction = selfContradictions[0]

  return {
    question: `In your opening, you stated "${contradiction.claim}". Later, you implied the opposite. Which is it?`,
    targets: personTarget,
    rationale: `Self-contradiction reveals inconsistency or dishonesty`,
    expectedToReveal: `Whether claim was honest or strategic`,
    intensity: 'direct',
  }
}

/**
 * Generate an evidence-based challenge
 * Cite facts that contradict the narrative
 */
export function generateEvidenceChallengeQuestion(
  anchor: CaseAnchor,
  personTarget: 'personA' | 'personB',
  evidenceFact: string
): TargetedQuestion {
  return {
    question: `You claim "${anchor.personAPosition}". However, ${evidenceFact}. How do you explain this?`,
    targets: personTarget,
    rationale: `Evidence directly contradicts stated position`,
    expectedToReveal: `Honesty, awareness, or selective memory`,
    intensity: 'confrontational',
  }
}

/**
 * Generate an investigative follow-up question
 */
export function generateFollowUpQuestion(
  anchor: CaseAnchor,
  personTarget: 'personA' | 'personB',
  previousClaim: string
): TargetedQuestion {
  return {
    question: `You said "${previousClaim}". Can you provide more detail about...?`,
    targets: personTarget,
    rationale: `Surface area for clarification and potential inconsistency`,
    expectedToReveal: `Depth of truthfulness of claim`,
    intensity: 'moderate',
  }
}

/**
 * Generate best next question based on investigation state
 */
export function generateBestNextQuestion(anchor: CaseAnchor): TargetedQuestion {
  // Priority 1: Severe contradictions
  const severeContradiction = anchor.contradictions.find(
    c => c.severity === 'severe' && !c.resolved
  )
  if (severeContradiction) {
    return {
      question: `You stated "${severeContradiction.claim}", but the evidence indicates "${severeContradiction.contradictingClaim}". How do you explain this critical discrepancy?`,
      targets: severeContradiction.speaker,
      rationale: `Severe contradiction must be resolved`,
      expectedToReveal: `Truth about core claim`,
      intensity: 'confrontational',
    }
  }

  // Priority 2: Timeline inconsistencies
  const timelineIssue = anchor.timelineIssues.find(t => !t.resolved)
  if (timelineIssue) {
    return generateTimelineQuestion(anchor, anchor.timelineIssues.indexOf(timelineIssue))
  }

  // Priority 3: Emotional understanding
  const unaddressedEmotion = anchor.emotionalConcerns.find(c => !c.addressed)
  if (unaddressedEmotion) {
    return {
      question: `When did you first experience ${unaddressedEmotion.concern}? Tell me about that moment.`,
      targets: unaddressedEmotion.affectedParty as 'personA' | 'personB',
      rationale: `Understand emotional origin`,
      expectedToReveal: `Root cause of conflict`,
      intensity: 'moderate',
    }
  }

  // Priority 4: Clarification on unanswered questions
  const unanswered = anchor.unresolvedQuestions.find(q => q.status === 'asked')
  if (unanswered) {
    return {
      question: unanswered.question,
      targets: unanswered.targetedAt,
      rationale: `Previously asked question needs clarification`,
      expectedToReveal: `Answer to open question`,
      intensity: 'moderate',
    }
  }

  // Default: Emotional clarification
  return generateEmotionalDeepDive(anchor, 'personA')
}

/**
 * Check if question is generic filler (REJECT THESE)
 */
export function isGenericFiller(question: string): boolean {
  const fillerPatterns = [
    /the situation is more nuanced/i,
    /let me provide context/i,
    /that's a good question/i,
    /the defense may clarify/i,
    /the court recognizes/i,
    /interesting point/i,
    /moving forward/i,
    /let me explain/i,
  ]

  return fillerPatterns.some(pattern => pattern.test(question))
}

/**
 * Check if question is properly anchored to case
 */
export function isAnchored(question: string, anchor: CaseAnchor): boolean {
  const coreWords = [
    anchor.coreConflict.split(' ')[0],
    anchor.personAPosition.split(' ')[0],
    anchor.personBPosition.split(' ')[0],
    anchor.primaryEmotion,
  ]

  return coreWords.some(word => question.toLowerCase().includes(word.toLowerCase()))
}
