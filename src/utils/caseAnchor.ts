/**
 * CASE ANCHOR SYSTEM
 * 
 * Every AI response stays anchored to the actual conflict.
 * This prevents generic dialogue, filler, and drift.
 * 
 * The CaseAnchor is initialized from user input and evolves through investigation.
 */

import { CaseSetup } from '@/types'

export interface Contradiction {
  id: string
  claim: string // What was claimed
  contradictingClaim: string // What contradicts it
  speaker: 'personA' | 'personB'
  severity: 'minor' | 'moderate' | 'severe'
  evidence: string[] // Statements that show contradiction
  resolved: boolean
  resolution?: string
}

export interface UnresolvedQuestion {
  id: string
  question: string // The actual question
  targetedAt: 'personA' | 'personB'
  askedBy: 'judge'
  status: 'asked' | 'partially_answered' | 'resolved'
  answer?: string
  followUpQuestions?: string[]
}

export interface TimelineIssue {
  id: string
  event: string
  claimedTime: string
  claimedBy: 'personA' | 'personB'
  contradictingTime?: string
  inconsistency: string
  resolved: boolean
}

export interface EmotionalConcern {
  id: string
  concern: string // e.g., "feeling unheard", "lack of trust"
  affectedParty: 'personA' | 'personB' | 'both'
  evidenceFrom: string[] // Statements showing this concern
  intensity: number // 0-100
  addressed: boolean
}

export interface CaseAnchor {
  // The absolute center of the investigation
  coreConflict: string
  
  // What each party claims
  personAPosition: string
  personBPosition: string
  
  // Contradictions found through investigation
  contradictions: Contradiction[]
  
  // Questions the judge needs answered
  unresolvedQuestions: UnresolvedQuestion[]
  
  // Timeline inconsistencies
  timelineIssues: TimelineIssue[]
  
  // Emotional layers
  emotionalConcerns: EmotionalConcern[]
  emotionalIntensity: number // 0-100
  primaryEmotion: string // hurt, anger, betrayal, frustration, etc.
  
  // Facts established as true
  establishedFacts: string[]
  
  // Metadata
  createdAt: number
  lastUpdated: number
}

/**
 * Initialize case anchor from user input
 */
export function initializeCaseAnchor(caseSetup: CaseSetup): CaseAnchor {
  return {
    coreConflict: caseSetup.title,
    personAPosition: caseSetup.personAArgument,
    personBPosition: caseSetup.personBArgument,
    contradictions: [],
    unresolvedQuestions: [],
    timelineIssues: [],
    emotionalConcerns: [],
    emotionalIntensity: 0,
    primaryEmotion: 'unknown',
    establishedFacts: [],
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  }
}

/**
 * Detect contradictions between statements
 */
export function detectContradictions(
  personAStatement: string,
  personBStatement: string,
  anchor: CaseAnchor
): Contradiction[] {
  // This would be enhanced with Gemini for semantic analysis
  // For now, basic pattern detection
  const detected: Contradiction[] = []

  // Simple contradiction detection patterns
  const aStatementLower = personAStatement.toLowerCase()
  const bStatementLower = personBStatement.toLowerCase()

  // Check for direct negations
  if (aStatementLower.includes('never') && bStatementLower.includes('always')) {
    detected.push({
      id: `contra_${Date.now()}`,
      claim: personAStatement,
      contradictingClaim: personBStatement,
      speaker: 'personA',
      severity: 'severe',
      evidence: [personAStatement, personBStatement],
      resolved: false,
    })
  }

  return detected
}

/**
 * Extract unresolved questions from statements
 */
export function identifyUnresolvedQuestions(
  personAStatement: string,
  personBStatement: string
): UnresolvedQuestion[] {
  const questions: UnresolvedQuestion[] = []

  // Question patterns to detect
  const questionPatterns = [
    /why\s+(?:did|do|would)/i,
    /how\s+(?:could|can|did)/i,
    /what\s+(?:about|happened)/i,
    /when\s+(?:did|do)/i,
    /where\s+(?:were|was)/i,
  ]

  const statements = [
    { text: personAStatement, target: 'personB' as const },
    { text: personBStatement, target: 'personA' as const },
  ]

  for (const stmt of statements) {
    for (const pattern of questionPatterns) {
      if (pattern.test(stmt.text)) {
        const matches = stmt.text.match(pattern)
        if (matches) {
          questions.push({
            id: `q_${Date.now()}_${Math.random()}`,
            question: `Regarding the claim: "${stmt.text.substring(0, 80)}..."`,
            targetedAt: stmt.target,
            askedBy: 'judge',
            status: 'asked',
          })
        }
      }
    }
  }

  return questions
}

/**
 * Add a new contradiction to the anchor
 */
export function addContradiction(
  anchor: CaseAnchor,
  contradiction: Contradiction
): CaseAnchor {
  return {
    ...anchor,
    contradictions: [...anchor.contradictions, contradiction],
    lastUpdated: Date.now(),
  }
}

/**
 * Mark a contradiction as resolved
 */
export function resolveContradiction(
  anchor: CaseAnchor,
  contradictionId: string,
  resolution: string
): CaseAnchor {
  return {
    ...anchor,
    contradictions: anchor.contradictions.map(c =>
      c.id === contradictionId
        ? { ...c, resolved: true, resolution }
        : c
    ),
    lastUpdated: Date.now(),
  }
}

/**
 * Record answer to unresolved question
 */
export function resolveQuestion(
  anchor: CaseAnchor,
  questionId: string,
  answer: string
): CaseAnchor {
  return {
    ...anchor,
    unresolvedQuestions: anchor.unresolvedQuestions.map(q =>
      q.id === questionId
        ? { ...q, status: 'resolved', answer }
        : q
    ),
    lastUpdated: Date.now(),
  }
}

/**
 * Add established fact
 */
export function addEstablishedFact(
  anchor: CaseAnchor,
  fact: string
): CaseAnchor {
  if (anchor.establishedFacts.includes(fact)) {
    return anchor
  }
  return {
    ...anchor,
    establishedFacts: [...anchor.establishedFacts, fact],
    lastUpdated: Date.now(),
  }
}

/**
 * Update emotional intensity and primary emotion
 */
export function updateEmotionalContext(
  anchor: CaseAnchor,
  primaryEmotion: string,
  intensity: number
): CaseAnchor {
  return {
    ...anchor,
    primaryEmotion,
    emotionalIntensity: Math.max(anchor.emotionalIntensity, intensity),
    lastUpdated: Date.now(),
  }
}

/**
 * Get summary of unresolved issues
 */
export function getUnresolvedSummary(anchor: CaseAnchor) {
  return {
    unresolved: {
      contradictions: anchor.contradictions.filter(c => !c.resolved).length,
      questions: anchor.unresolvedQuestions.filter(q => q.status !== 'resolved').length,
      timelineIssues: anchor.timelineIssues.filter(t => !t.resolved).length,
    },
    total: anchor.contradictions.filter(c => !c.resolved).length +
           anchor.unresolvedQuestions.filter(q => q.status !== 'resolved').length +
           anchor.timelineIssues.filter(t => !t.resolved).length,
  }
}

/**
 * Get context string for AI prompts
 */
export function getCaseAnchorContext(anchor: CaseAnchor): string {
  const unresolved = getUnresolvedSummary(anchor)
  
  let context = `
CASE ANCHOR - Investigation Context
====================================

Core Conflict: ${anchor.coreConflict}

Person A Position: ${anchor.personAPosition}
Person B Position: ${anchor.personBPosition}

Established Facts:
${anchor.establishedFacts.map(f => `- ${f}`).join('\n') || '- None yet'}

Unresolved Contradictions (${unresolved.unresolved.contradictions}):
${anchor.contradictions
  .filter(c => !c.resolved)
  .map(c => `- "${c.claim}" vs "${c.contradictingClaim}" (${c.severity})`)
  .join('\n') || '- None yet'}

Unresolved Questions (${unresolved.unresolved.questions}):
${anchor.unresolvedQuestions
  .filter(q => q.status !== 'resolved')
  .map(q => `- ${q.question}`)
  .join('\n') || '- None yet'}

Emotional Context:
- Primary emotion: ${anchor.primaryEmotion}
- Intensity: ${anchor.emotionalIntensity}/100

Investigation Priority:
${unresolved.total === 0 ? '✓ Ready for verdict' : `- ${unresolved.total} unresolved issue(s) remain`}
`

  return context
}
