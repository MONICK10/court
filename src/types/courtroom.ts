/**
 * INVESTIGATION-CENTRIC COURTROOM TYPES
 * Core data structures for AI-driven dispute investigation
 */

import { CourtMood } from './index'

/**
 * Core conflict anchor - keeps all investigation grounded
 * Prevents conversation drift and filler dialogue
 */
export interface CaseAnchor {
  coreConflict: string // The actual dispute central issue
  emotionalConcerns: string[] // What people care about emotionally
  contradictions: Array<{
    statement: string
    contradiction: string
    severity: 'minor' | 'moderate' | 'severe'
    speakers: string[]
  }>
  unresolvedQuestions: Array<{
    question: string
    askedOf: string
    status: 'asked' | 'partially_answered' | 'resolved'
    answer?: string
  }>
  timelineIssues: Array<{
    event: string
    claimedTime: string
    actualEvidence?: string
    inconsistency: string
  }>
  importantFacts: string[] // Key facts established as true
  emotionalContext: {
    primaryEmotion: string // hurt, anger, betrayal, etc
    secondaryEmotions: string[]
    intensity: number // 0-100
  }
}

/**
 * Judge's internal assessment of case clarity
 * Determines when verdict conditions are met
 */
export interface JudgeConfidence {
  overall: number // 0-100
  contradictionsRemaining: number
  clarityLevel: number // 0-100
  emotionalUnderstanding: number // 0-100
  evidenceSufficient: boolean
  readyForVerdict: boolean
  reasoning: string[] // Why judge is/isn't confident
}

/**
 * Structured courtroom message with decision logic
 * AI returns this, frontend renders from it
 */
export interface CourtMessage {
  speaker: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'
  message: string // The actual spoken/displayed message
  messageType: 'statement' | 'question' | 'observation' | 'objection' | 'verdict'
  
  // Judge decision framework
  nextTarget?: 'person_a' | 'person_b' | 'both' | null
  requiresUserResponse: boolean
  question?: string // Specific targeted question for investigation
  
  // Investigation metadata
  contradictionDetected?: boolean
  addressedContradiction?: string
  clarifiedQuestion?: string
  
  // Flow control
  courtroomPhase: 'investigation' | 'deep_investigation' | 'emotional_clarification' | 'verdict'
  allowUserInput: boolean
  
  // Emotional context
  emotional: {
    intensity: number // 0-100
    tone: 'investigative' | 'empathetic' | 'challenging' | 'neutral' | 'compassionate'
  }
  
  // Judge's internal state
  judgeConfidence: JudgeConfidence
  
  // For UI choreography
  messageDuration?: number // ms to display
  hasTyping?: boolean
  emphasis?: boolean
}

/**
 * Investigation state - replaces phase-based model
 */
export interface InvestigationState {
  phase: 'opening' | 'investigation' | 'deep_investigation' | 'emotional_clarification' | 'verdict'
  turnCount: number
  activeInvestigationRound: number
  contradictionsExplored: string[]
  questionsAsked: string[]
  lastJudgeObservation?: string
}

/**
 * Judge's internal working memory
 * Not displayed to user, used for reasoning
 */
export interface JudgeMemory {
  observations: Array<{
    timestamp: number
    observation: string
    priority: 'high' | 'medium' | 'low'
    addressedIn?: number // turn index where addressed
  }>
  patterns: {
    personAPatterns: string[]
    personBPatterns: string[]
    emotionalPatterns: string[]
  }
  priorities: {
    mostUrgentQuestion: string
    mostImportantContradiction: string
    emotionalCore: string
  }
  verdictThinking?: string
}

/**
 * Complete courtroom state for investigation
 */
export interface CourtInvestigationState {
  // Case foundation
  caseData: {
    title: string
    personAName: string
    personBName: string
    personAStatement: string
    personBStatement: string
    mood: CourtMood
  }
  
  // Investigation anchoring
  caseAnchor: CaseAnchor
  
  // Messages exchanged
  messages: Array<{
    speaker: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'
    content: string
    turnNumber: number
    timestamp: number
  }>
  
  // Investigation tracking
  investigation: InvestigationState
  
  // Judge reasoning
  judgeMemory: JudgeMemory
  judgeConfidence: JudgeConfidence
  
  // Participation
  userParticipationCount: {
    personA: number
    personB: number
  }
}
