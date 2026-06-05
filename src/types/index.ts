export type CourtMood = 'savage' | 'funny' | 'serious' | 'drama'
export type Language = 'english' | 'tamil'
export type CourtPhase = 'opening' | 'investigation' | 'crossExamination' | 'evidence' | 'finalStatements' | 'verdict' | 'courtOrders'
export type JudgementResult = 'personAFavored' | 'personBFavored' | 'sharedResponsibility'

export interface CaseSetup {
  title: string
  personAName: string
  personAArgument: string
  personBName: string
  personBArgument: string
  mood: CourtMood
  language?: Language
}

// ==========================================
// EVIDENCE SYSTEM
// ==========================================

export interface Evidence {
  id: string
  uploadedBy: 'personA' | 'personB'
  type: 'screenshot' | 'chat' | 'photo' | 'document' | 'text'
  description: string
  timestamp: number
  url?: string
  content?: string
}

// ==========================================
// TASK/COURT ORDER SYSTEM
// ==========================================

export interface CourtOrder {
  id: string
  description: string
  dueDate?: number
  completed: boolean
  assignedTo: 'personA' | 'personB' | 'both'
  createdAt: number
  completedAt?: number
}

// ==========================================
// VERDICT SYSTEM
// ==========================================

export interface VerdictData {
  winner: JudgementResult
  facts: string[]
  contradictions: string[]
  emotionalAnalysis: string
  responsibilityAnalysis: string
  courtOrders: CourtOrder[]
  verdictText: string
  timestamp: number
}

// ==========================================
// CONVERSATION SYSTEM
// ==========================================

export interface ConversationMessage {
  speaker: 'judge' | 'lawyerA' | 'lawyerB' | 'userA' | 'userB'
  text: string
  timestamp: number
}

// ==========================================
// CASE MEMORY - Master object for entire case
// ==========================================

export interface CaseMemory {
  // Case identifiers
  id: string
  title: string
  mood: CourtMood
  createdAt: number

  // People
  personA: {
    name: string
    statement: string
    finalStatement?: string
  }
  personB: {
    name: string
    statement: string
    finalStatement?: string
  }

  // Investigation data
  contradictions: string[]
  emotionalSignals: {
    personA: string[]
    personB: string[]
  }
  evidence: Evidence[]
  conversationHistory: ConversationMessage[]

  // Language
  language: Language

  // Phase management
  currentPhase: CourtPhase
  phaseHistory: CourtPhase[]
  phaseTurns: number
  currentlyQuestioning: 'userA' | 'userB' | null
  crossExamRound: number

  // Verdict
  verdict?: VerdictData

  // Meta
  totalTurns: number
  investigationComplete: boolean
  evidenceRequested: boolean
}

// ==========================================
// CASE STORAGE (for dashboard)
// ==========================================

export interface CaseRecord {
  id: string
  title: string
  winner: JudgementResult
  date: number
  mode: CourtMood
  personAName: string
  personBName: string
  verdictSummary: string
  courtOrders: CourtOrder[]
}

// ==========================================
// LEGACY TYPES (for compatibility)
// ==========================================

export interface Message {
  id: string
  speaker: 'judge' | 'lawyerA' | 'lawyerB'
  content: string
  timestamp: number
  isTyping?: boolean
}

export interface Verdict {
  winner: 'A' | 'B' | 'draw'
  winnerConfidence: number
  verdict: string
  emotionalSummary: string
}

export interface DialogueOption {
  speaker: 'judge' | 'lawyerA' | 'lawyerB'
  text: string
  mood?: CourtMood
}

export interface UserStatement {
  id: string
  speaker: 'A' | 'B'
  content: string
  timestamp: number
}

export interface Contradiction {
  id: string
  insight: string
  severity: 'minor' | 'moderate' | 'severe'
}

export interface CourtcaseSession {
  id: string
  caseSetup: CaseSetup
  currentPhase: CourtPhase
}

export interface DecisionPoint {
  id: string
  type: 'user_speak' | 'lawyer_continues' | 'judge_decision'
  speaker: 'A' | 'B' | 'judge'
  options: {
    speak: string
    continue: string
  }
}

export interface JudgeDecisionAction {
  type: 'ask_clarification' | 'challenge_contradiction' | 'cross_examine' | 'deliver_verdict' | 'summarize_phase'
  target?: 'A' | 'B' | 'both'
  content: string
}
