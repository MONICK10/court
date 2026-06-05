/**
 * COURTROOM MEMORY SYSTEM
 * Persistent memory that tracks everything the AI needs to make decisions
 */

import { CaseSetup, CourtMood, Message, UserStatement, Contradiction } from '@/types'

export type CourtroomPhase = 
  | 'opening_statements'
  | 'lawyer_reframing'
  | 'cross_examination'
  | 'emotional_clarification'
  | 'final_arguments'
  | 'verdict'

export type Speaker = 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'

export interface EmotionalSignal {
  phase: CourtroomPhase
  speaker: 'A' | 'B'
  signal: string // 'defensive', 'aggressive', 'emotional', 'clarifying'
  intensity: number // 0-100
  evidence: string // text that triggered the signal
}

export interface UnresolvedQuestion {
  id: string
  askedBy: Speaker
  targetedAt: 'A' | 'B' | 'both'
  question: string
  timestamp: number
  status: 'asked' | 'partially_answered' | 'answered'
}

export interface CourtroomMemoryState {
  // Case setup
  caseSetup: CaseSetup
  
  // Session metadata
  sessionId: string
  createdAt: number
  lastUpdated: number
  
  // Current state
  currentPhase: CourtroomPhase
  activeSpeaker: Speaker | null
  round: number
  
  // Conversation history
  conversationHistory: Array<{
    id: string
    speaker: Speaker
    message: string
    timestamp: number
    phase: CourtroomPhase
  }>
  
  // User statements (for contradiction detection & memory)
  userStatements: {
    A: Array<{
      content: string
      timestamp: number
      emotionalTone?: string
      phaseMentioned: CourtroomPhase
    }>
    B: Array<{
      content: string
      timestamp: number
      emotionalTone?: string
      phaseMentioned: CourtroomPhase
    }>
  }
  
  // Detected contradictions
  contradictions: Array<{
    id: string
    statementA: string
    statementB: string
    insight: string
    severity: 'minor' | 'moderate' | 'severe'
    timestamp: number
  }>
  
  // Emotional tracking
  emotionalSignals: EmotionalSignal[]
  emotionalTrajectory: {
    A: { phase: CourtroomPhase; tone: string }[]
    B: { phase: CourtroomPhase; tone: string }[]
  }
  
  // Unresolved topics
  unresolvedQuestions: UnresolvedQuestion[]
  
  // AI decision tracking (for consistency)
  decisionHistory: Array<{
    timestamp: number
    phase: CourtroomPhase
    decision: string
    reasoning: string
  }>
  
  // Judgment context (collected before verdict)
  judgmentContext: {
    strongPointsA: string[]
    strongPointsB: string[]
    redFlagsA: string[]
    redFlagsB: string[]
    communicationPatterns: string[]
    emotionalHealthIndicators: string[]
  }
}

/**
 * Initialize a new courtroom memory state
 */
export function initializeMemory(caseSetup: CaseSetup): CourtroomMemoryState {
  return {
    caseSetup,
    sessionId: `session-${Date.now()}`,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    currentPhase: 'opening_statements',
    activeSpeaker: null,
    round: 1,
    conversationHistory: [],
    userStatements: { A: [], B: [] },
    contradictions: [],
    emotionalSignals: [],
    emotionalTrajectory: { A: [], B: [] },
    unresolvedQuestions: [],
    decisionHistory: [],
    judgmentContext: {
      strongPointsA: [],
      strongPointsB: [],
      redFlagsA: [],
      redFlagsB: [],
      communicationPatterns: [],
      emotionalHealthIndicators: [],
    },
  }
}

/**
 * Record a message in conversation history
 */
export function recordMessage(
  memory: CourtroomMemoryState,
  speaker: Speaker,
  message: string
): CourtroomMemoryState {
  const updated = { ...memory }
  updated.conversationHistory.push({
    id: `msg-${Date.now()}-${Math.random()}`,
    speaker,
    message,
    timestamp: Date.now(),
    phase: memory.currentPhase,
  })
  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Record a user statement and detect contradictions
 */
export function recordUserStatement(
  memory: CourtroomMemoryState,
  speaker: 'A' | 'B',
  statement: string,
  emotionalTone?: string
): CourtroomMemoryState {
  const updated = { ...memory }
  
  updated.userStatements[speaker].push({
    content: statement,
    timestamp: Date.now(),
    emotionalTone,
    phaseMentioned: memory.currentPhase,
  })
  
  // Detect contradictions with opponent's statements
  const opponentSpeaker = speaker === 'A' ? 'B' : 'A'
  const opponentStatements = updated.userStatements[opponentSpeaker]
  
  opponentStatements.forEach(oppStatement => {
    const contradiction = detectContradiction(statement, oppStatement)
    if (contradiction) {
      updated.contradictions.push({
        id: `contra-${Date.now()}`,
        statementA: speaker === 'A' ? statement : oppStatement.content,
        statementB: speaker === 'B' ? statement : oppStatement.content,
        insight: contradiction.insight,
        severity: contradiction.severity,
        timestamp: Date.now(),
      })
    }
  })
  
  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Detect if two statements contradict each other
 */
function detectContradiction(
  statement1: string,
  statement2: { content: string }
): { insight: string; severity: 'minor' | 'moderate' | 'severe' } | null {
  const text1 = statement1.toLowerCase()
  const text2 = statement2.content.toLowerCase()
  
  // Simple contradiction detection
  const opposites = [
    ['always', 'never'],
    ['said', 'denied'],
    ['happened', 'didn\'t happen'],
    ['true', 'false'],
  ]
  
  for (const [word1, word2] of opposites) {
    if ((text1.includes(word1) && text2.includes(word2)) ||
        (text1.includes(word2) && text2.includes(word1))) {
      return {
        insight: `Contradiction detected between: "${statement1.substring(0, 50)}..." and "${statement2.content.substring(0, 50)}..."`,
        severity: 'moderate',
      }
    }
  }
  
  return null
}

/**
 * Record emotional signal
 */
export function recordEmotionalSignal(
  memory: CourtroomMemoryState,
  speaker: 'A' | 'B',
  signal: string,
  intensity: number,
  evidence: string
): CourtroomMemoryState {
  const updated = { ...memory }
  
  updated.emotionalSignals.push({
    phase: memory.currentPhase,
    speaker,
    signal,
    intensity,
    evidence,
  })
  
  // Track trajectory
  updated.emotionalTrajectory[speaker].push({
    phase: memory.currentPhase,
    tone: signal,
  })
  
  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Record unresolved question
 */
export function recordUnresolvedQuestion(
  memory: CourtroomMemoryState,
  askedBy: Speaker,
  targetedAt: 'A' | 'B' | 'both',
  question: string
): CourtroomMemoryState {
  const updated = { ...memory }
  
  updated.unresolvedQuestions.push({
    id: `q-${Date.now()}`,
    askedBy,
    targetedAt,
    question,
    timestamp: Date.now(),
    status: 'asked',
  })
  
  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Move to next phase
 */
export function advancePhase(memory: CourtroomMemoryState): CourtroomMemoryState {
  const phases: CourtroomPhase[] = [
    'opening_statements',
    'lawyer_reframing',
    'cross_examination',
    'emotional_clarification',
    'final_arguments',
    'verdict',
  ]
  
  const currentIndex = phases.indexOf(memory.currentPhase)
  const nextPhase = phases[currentIndex + 1] || 'verdict'
  
  return {
    ...memory,
    currentPhase: nextPhase,
    round: memory.currentPhase === 'lawyer_reframing' ? memory.round + 1 : memory.round,
    lastUpdated: Date.now(),
  }
}

/**
 * Record a decision for tracking consistency
 */
export function recordDecision(
  memory: CourtroomMemoryState,
  decision: string,
  reasoning: string
): CourtroomMemoryState {
  const updated = { ...memory }
  
  updated.decisionHistory.push({
    timestamp: Date.now(),
    phase: memory.currentPhase,
    decision,
    reasoning,
  })
  
  updated.lastUpdated = Date.now()
  return updated
}

/**
 * Get last N messages
 */
export function getRecentMessages(
  memory: CourtroomMemoryState,
  count: number = 5
): typeof memory.conversationHistory {
  return memory.conversationHistory.slice(-count)
}

/**
 * Get all statements from a speaker
 */
export function getStatementsSummary(
  memory: CourtroomMemoryState,
  speaker: 'A' | 'B'
): string {
  const statements = memory.userStatements[speaker]
  return statements.map(s => s.content).join(' ')
}

/**
 * Get context summary for AI decision-making
 */
export function getMemorySummary(memory: CourtroomMemoryState): string {
  return `
COURTROOM STATE SUMMARY:
- Phase: ${memory.currentPhase}
- Round: ${memory.round}
- Total messages: ${memory.conversationHistory.length}
- Contradictions: ${memory.contradictions.length}
- Unresolved questions: ${memory.unresolvedQuestions.length}

PERSON A STATEMENTS: ${memory.userStatements.A.length} statements
${memory.userStatements.A.length > 0 ? `Latest: "${memory.userStatements.A[memory.userStatements.A.length - 1].content}"` : 'None yet'}

PERSON B STATEMENTS: ${memory.userStatements.B.length} statements  
${memory.userStatements.B.length > 0 ? `Latest: "${memory.userStatements.B[memory.userStatements.B.length - 1].content}"` : 'None yet'}

CONTRADICTIONS FOUND: ${memory.contradictions.length}
${memory.contradictions.slice(-3).map(c => `- ${c.insight}`).join('\n')}

EMOTIONAL TONE:
Person A: ${memory.emotionalTrajectory.A[memory.emotionalTrajectory.A.length - 1]?.tone || 'neutral'}
Person B: ${memory.emotionalTrajectory.B[memory.emotionalTrajectory.B.length - 1]?.tone || 'neutral'}
`.trim()
}
