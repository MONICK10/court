/**
 * INVESTIGATION MEMORY SYSTEM
 * Manages investigation state, case anchoring, and judge confidence
 */

import { 
  CaseAnchor, 
  JudgeConfidence, 
  CourtInvestigationState,
  InvestigationState,
  JudgeMemory
} from '@/types/courtroom'
import { CaseSetup, CourtMood } from '@/types'

/**
 * Initialize investigation from user case setup
 * Extracts core conflict, contradictions, and emotional concerns
 */
export function initializeInvestigation(caseSetup: CaseSetup): CourtInvestigationState {
  const caseAnchor = extractCaseAnchor(
    caseSetup.title,
    caseSetup.personAName,
    caseSetup.personBName,
    caseSetup.personAStatement,
    caseSetup.personBStatement
  )

  return {
    caseData: {
      title: caseSetup.title,
      personAName: caseSetup.personAName,
      personBName: caseSetup.personBName,
      personAStatement: caseSetup.personAStatement,
      personBStatement: caseSetup.personBStatement,
      mood: caseSetup.mood,
    },
    caseAnchor,
    messages: [],
    investigation: {
      phase: 'opening',
      turnCount: 0,
      activeInvestigationRound: 0,
      contradictionsExplored: [],
    },
    judgeMemory: {
      observations: [],
      patterns: {
        personAPatterns: [],
        personBPatterns: [],
        emotionalPatterns: [],
      },
      priorities: {
        mostUrgentQuestion: '',
        mostImportantContradiction: '',
        emotionalCore: '',
      },
    },
    judgeConfidence: initializeJudgeConfidence(),
    userParticipationCount: {
      personA: 0,
      personB: 0,
    },
  }
}

/**
 * Extract case anchor from initial statements
 * Identifies core conflict, contradictions, and emotional concerns
 */
function extractCaseAnchor(
  title: string,
  personAName: string,
  personBName: string,
  personAStatement: string,
  personBStatement: string
): CaseAnchor {
  // This is where AI analysis would happen
  // For now, create basic structure

  return {
    coreConflict: title,
    emotionalConcerns: [],
    contradictions: [],
    unresolvedQuestions: [
      {
        question: `What is ${personAName}'s perspective on the core issue?`,
        askedOf: personAName,
        status: 'asked',
      },
      {
        question: `What is ${personBName}'s perspective on the core issue?`,
        askedOf: personBName,
        status: 'asked',
      },
    ],
    timelineIssues: [],
    importantFacts: [],
    emotionalContext: {
      primaryEmotion: 'unknown',
      secondaryEmotions: [],
      intensity: 0,
    },
  }
}

/**
 * Initialize judge confidence at case start
 */
export function initializeJudgeConfidence(): JudgeConfidence {
  return {
    overall: 10, // Very low at start - judge knows nothing
    contradictionsRemaining: 0,
    clarityLevel: 0,
    emotionalUnderstanding: 0,
    evidenceSufficient: false,
    readyForVerdict: false,
    reasoning: [
      'Investigation beginning',
      'Awaiting initial statements from both parties',
    ],
  }
}

/**
 * Update judge confidence based on investigation progress
 */
export function updateJudgeConfidence(
  state: CourtInvestigationState,
  update: Partial<JudgeConfidence>
): JudgeConfidence {
  const updated: JudgeConfidence = {
    ...state.judgeConfidence,
    ...update,
  }

  // Calculate verdictReady based on other metrics
  updated.readyForVerdict =
    updated.overall >= 75 &&
    updated.clarityLevel >= 70 &&
    updated.contradictionsRemaining <= 1 &&
    updated.emotionalUnderstanding >= 60

  return updated
}

/**
 * Record a message in the investigation
 */
export function recordMessage(
  state: CourtInvestigationState,
  speaker: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB',
  content: string
): CourtInvestigationState {
  return {
    ...state,
    messages: [
      ...state.messages,
      {
        speaker,
        content,
        turnNumber: state.investigation.turnCount,
        timestamp: Date.now(),
      },
    ],
  }
}

/**
 * Update case anchor with new contradictions found
 */
export function addContradiction(
  anchor: CaseAnchor,
  contradiction: {
    statement: string
    contradiction: string
    severity: 'minor' | 'moderate' | 'severe'
    speakers: string[]
  }
): CaseAnchor {
  return {
    ...anchor,
    contradictions: [...anchor.contradictions, contradiction],
  }
}

/**
 * Mark a question as resolved
 */
export function resolveQuestion(
  anchor: CaseAnchor,
  questionIndex: number,
  answer: string
): CaseAnchor {
  const updated = { ...anchor }
  updated.unresolvedQuestions = anchor.unresolvedQuestions.map((q, i) =>
    i === questionIndex
      ? { ...q, status: 'resolved', answer }
      : q
  )
  return updated
}

/**
 * Add important fact to anchor
 */
export function addImportantFact(
  anchor: CaseAnchor,
  fact: string
): CaseAnchor {
  return {
    ...anchor,
    importantFacts: [...anchor.importantFacts, fact],
  }
}

/**
 * Get summary of unresolved issues for judge reasoning
 */
export function getUnresolvedIssuesSummary(anchor: CaseAnchor): {
  unresolvedQuestions: string[]
  activeContradictions: string[]
  emotionalConcerns: string[]
} {
  return {
    unresolvedQuestions: anchor.unresolvedQuestions
      .filter(q => q.status !== 'resolved')
      .map(q => q.question),
    activeContradictions: anchor.contradictions.map(c => c.contradiction),
    emotionalConcerns: anchor.emotionalConcerns,
  }
}

/**
 * Get investigation summary for logging/debugging
 */
export function getInvestigationSummary(state: CourtInvestigationState): string {
  const { caseAnchor, investigation, judgeConfidence } = state
  const issues = getUnresolvedIssuesSummary(caseAnchor)

  return `
INVESTIGATION STATUS:
- Phase: ${investigation.phase}
- Turn: ${investigation.turnCount}
- Judge Confidence: ${judgeConfidence.overall}%
- Clarity: ${judgeConfidence.clarityLevel}%

CASE ANCHOR:
- Core Conflict: ${caseAnchor.coreConflict}
- Unresolved Questions: ${issues.unresolvedQuestions.length}
- Active Contradictions: ${issues.activeContradictions.length}
- Important Facts: ${caseAnchor.importantFacts.length}

EMOTIONAL CONTEXT:
- Primary: ${caseAnchor.emotionalContext.primaryEmotion}
- Intensity: ${caseAnchor.emotionalContext.intensity}%
`
}

/**
 * Advance investigation phase
 */
export function advanceInvestigationPhase(
  state: CourtInvestigationState
): CourtInvestigationState {
  const phases: Array<InvestigationState['phase']> = [
    'opening',
    'investigation',
    'deep_investigation',
    'emotional_clarification',
    'verdict',
  ]

  const currentIndex = phases.indexOf(state.investigation.phase)
  const nextPhase = phases[currentIndex + 1] || 'verdict'

  return {
    ...state,
    investigation: {
      ...state.investigation,
      phase: nextPhase,
      activeInvestigationRound: state.investigation.activeInvestigationRound + 1,
    },
  }
}
