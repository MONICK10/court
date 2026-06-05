import { CaseSetup, CourtcaseSession, UserStatement, Contradiction, Message } from '@/types'

/**
 * Initialize a new courtroom session
 */
export function initializeSession(caseSetup: CaseSetup): CourtcaseSession {
  return {
    id: `session-${Date.now()}`,
    caseSetup,
    currentPhase: 'opening',
    round: 1,
    conversationHistory: [],
    personAStatements: [],
    personBStatements: [],
    contradictions: [],
    lawyerAContext: '',
    lawyerBContext: '',
    judgeObservations: [],
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  }
}

/**
 * Add a user statement to the session
 */
export function addUserStatement(
  session: CourtcaseSession,
  speaker: 'A' | 'B',
  content: string,
  emotionalTone?: 'defensive' | 'aggressive' | 'clarifying' | 'emotional'
): CourtcaseSession {
  const statement: UserStatement = {
    id: `stmt-${Date.now()}`,
    speaker,
    content,
    timestamp: Date.now(),
    emotionalTone,
  }

  const updated = { ...session }

  if (speaker === 'A') {
    updated.personAStatements = [...updated.personAStatements, statement]
  } else {
    updated.personBStatements = [...updated.personBStatements, statement]
  }

  // Detect new contradictions
  const newContradictions = detectContradictions(statement, speaker === 'A' ? updated.personBStatements : updated.personAStatements)
  updated.contradictions = [...updated.contradictions, ...newContradictions]

  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Detect contradictions between a new statement and previous ones
 */
function detectContradictions(newStatement: UserStatement, oppositePartyStatements: UserStatement[]): Contradiction[] {
  const contradictions: Contradiction[] = []
  const keywords = extractKeywords(newStatement.content)

  oppositePartyStatements.forEach(oldStatement => {
    const oldKeywords = extractKeywords(oldStatement.content)
    
    // Simple contradiction detection: look for opposing claims
    if (hasOpposingClaims(keywords, oldKeywords)) {
      contradictions.push({
        id: `contra-${Date.now()}`,
        statement1: newStatement,
        statement2: oldStatement,
        insight: generateContradictionInsight(newStatement, oldStatement),
        severity: calculateSeverity(newStatement.content, oldStatement.content),
      })
    }
  })

  return contradictions
}

/**
 * Extract key concepts from a statement
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/)
  const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'was', 'are', 'were', 'you', 'i', 'he', 'she', 'it', 'that', 'this', 'i\'m', 'i\'ll']
  
  return words.filter(
    w => w.length > 3 && !stopwords.includes(w) && !w.match(/^[,.\!?;:]/)
  )
}

/**
 * Check if two sets of keywords have opposing claims
 */
function hasOpposingClaims(keywords1: string[], keywords2: string[]): boolean {
  const opposites = new Map([
    ['always', 'never'],
    ['deny', 'admit'],
    ['honest', 'dishonest'],
    ['true', 'false'],
    ['yes', 'no'],
    ['present', 'absent'],
    ['available', 'unavailable'],
  ])

  for (const [key1, key2] of opposites.entries()) {
    if ((keywords1.includes(key1) && keywords2.includes(key2)) ||
        (keywords1.includes(key2) && keywords2.includes(key1))) {
      return true
    }
  }

  // Check for direct negation
  if (keywords1.some(k => keywords2.some(k2 => k === k2 && 
    (keywords1.join(' ').includes('not') || keywords2.join(' ').includes('not'))))) {
    return true
  }

  return false
}

/**
 * Generate an insight about the contradiction
 */
function generateContradictionInsight(stmt1: UserStatement, stmt2: UserStatement): string {
  const person1 = stmt1.speaker === 'A' ? 'Plaintiff' : 'Defendant'
  const person2 = stmt2.speaker === 'A' ? 'Plaintiff' : 'Defendant'
  
  const insights = [
    `${person1} claims differ from ${person2}'s account`,
    `There is a direct conflict in narratives between parties`,
    `One party's recollection contradicts the other's version`,
    `The timeline or facts presented don't align`,
    `Both parties tell different stories about the same event`,
  ]

  return insights[Math.floor(Math.random() * insights.length)]
}

/**
 * Calculate severity of contradiction (minor/moderate/severe)
 */
function calculateSeverity(content1: string, content2: string): 'minor' | 'moderate' | 'severe' {
  const emotionalWords = ['hate', 'love', 'always', 'never', 'worst', 'best', 'destroyed', 'betrayed']
  const hasEmotional = emotionalWords.some(w => 
    (content1.toLowerCase().includes(w) || content2.toLowerCase().includes(w))
  )

  if (hasEmotional) return 'severe'
  if (content1.length > 100 && content2.length > 100) return 'moderate'
  return 'minor'
}

/**
 * Add a message to conversation history
 */
export function addMessage(
  session: CourtcaseSession,
  message: Message
): CourtcaseSession {
  return {
    ...session,
    conversationHistory: [...session.conversationHistory, message],
    lastUpdated: Date.now(),
  }
}

/**
 * Add judge observation
 */
export function addJudgeObservation(
  session: CourtcaseSession,
  observation: string
): CourtcaseSession {
  return {
    ...session,
    judgeObservations: [...session.judgeObservations, observation],
    lastUpdated: Date.now(),
  }
}

/**
 * Update lawyer context with current argument strategy
 */
export function updateLawyerContext(
  session: CourtcaseSession,
  lawyer: 'A' | 'B',
  contextUpdate: string
): CourtcaseSession {
  const updated = { ...session }
  if (lawyer === 'A') {
    updated.lawyerAContext = contextUpdate
  } else {
    updated.lawyerBContext = contextUpdate
  }
  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Determine if we should move to next phase
 */
export function shouldProgressPhase(session: CourtcaseSession): boolean {
  const minRoundsPerPhase = 2
  const maxRoundsPerPhase = 4

  if (session.round < minRoundsPerPhase) return false
  if (session.round >= maxRoundsPerPhase) return true

  // Progress if contradictions detected and challenged
  if (session.contradictions.length > 0) {
    return Math.random() > 0.6 // 40% chance to progress after contradictions
  }

  return false
}

/**
 * Get the next phase
 */
export function getNextCourtPhase(
  currentPhase: CourtcaseSession['currentPhase']
): CourtcaseSession['currentPhase'] | 'verdict' {
  const phases: (CourtcaseSession['currentPhase'] | 'verdict')[] = [
    'opening',
    'statements',
    'examination',
    'emotional',
    'closing',
    'verdict',
  ]

  const currentIndex = phases.indexOf(currentPhase)
  return phases[Math.min(currentIndex + 1, phases.length - 1)]
}

/**
 * Get all statements for context
 */
export function getFullStatementContext(session: CourtcaseSession, speaker: 'A' | 'B'): string {
  const statements = speaker === 'A' ? session.personAStatements : session.personBStatements
  return statements.map(s => `"${s.content}"`).join(' ... ')
}

/**
 * Check if there are unresolved contradictions
 */
export function hasUnresolvedContradictions(session: CourtcaseSession): boolean {
  return session.contradictions.length > 0 && session.currentPhase !== 'verdict'
}

/**
 * Get judge's next action based on session state
 */
export function determineJudgeAction(session: CourtcaseSession): {
  action: 'ask_clarification' | 'challenge_contradiction' | 'cross_examine' | 'deliver_verdict'
  reason: string
} {
  // If we have unresolved contradictions in early phases
  if (session.contradictions.length > 0 && session.round <= 2 && session.currentPhase === 'statements') {
    return {
      action: 'ask_clarification',
      reason: 'Judge noticed conflicting accounts',
    }
  }

  // If we're in examination phase with contradictions
  if (session.contradictions.length > 1 && session.currentPhase === 'examination') {
    return {
      action: 'challenge_contradiction',
      reason: 'Judge challenges inconsistencies',
    }
  }

  // If we're approaching verdict phase
  if (session.currentPhase === 'closing' || session.round >= 4) {
    return {
      action: 'deliver_verdict',
      reason: 'Sufficient evidence presented',
    }
  }

  // Default to cross examination to dig deeper
  return {
    action: 'cross_examine',
    reason: 'Judge probes deeper into claims',
  }
}
