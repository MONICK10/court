/**
 * TARGETED QUESTION GENERATION ENGINE
 * Judge asks contextual, conflict-grounded questions
 * NOT generic courtroom filler
 */

import { CaseAnchor, JudgeMemory } from '@/types/courtroom'

interface QuestionContext {
  personAName: string
  personBName: string
  personAStatement: string
  personBStatement: string
  recentMessages: string[]
  caseAnchor: CaseAnchor
  judgeMemory: JudgeMemory
}

interface TargetedQuestion {
  question: string
  target: 'personA' | 'personB' | 'both'
  purpose: 'clarify' | 'challenge' | 'investigate' | 'explore_emotion'
  reasoning: string
}

/**
 * Generate targeted questions based on actual case contradictions
 */
export function generateTargetedQuestions(
  context: QuestionContext
): TargetedQuestion[] {
  const questions: TargetedQuestion[] = []

  // 1. Questions about contradictions
  if (context.caseAnchor.contradictions.length > 0) {
    context.caseAnchor.contradictions.forEach(contradiction => {
      questions.push({
        question: `The court has identified an inconsistency: ${contradiction.statement} versus ${contradiction.contradiction}. ${contradiction.speakers[0]}, please explain.`,
        target: contradiction.speakers[0] === context.personAName ? 'personA' : 'personB',
        purpose: 'challenge',
        reasoning: `Address severity-${contradiction.severity} contradiction`,
      })
    })
  }

  // 2. Questions about unresolved questions
  if (context.caseAnchor.unresolvedQuestions.length > 0) {
    context.caseAnchor.unresolvedQuestions
      .filter(q => q.status === 'asked')
      .forEach(q => {
        questions.push({
          question: q.question,
          target: q.askedOf === context.personAName ? 'personA' : 'personB',
          purpose: 'clarify',
          reasoning: 'Follow up on previously asked question',
        })
      })
  }

  // 3. Questions about emotional context
  if (context.caseAnchor.emotionalContext.intensity > 50) {
    questions.push({
      question: `The court recognizes significant emotional weight here. ${context.personAName}, what is most important to you in this situation?`,
      target: 'personA',
      purpose: 'explore_emotion',
      reasoning: 'Investigate emotional core of conflict',
    })

    questions.push({
      question: `${context.personBName}, from your perspective, what do you feel is being misunderstood?`,
      target: 'personB',
      purpose: 'explore_emotion',
      reasoning: 'Explore emotional perspective of other party',
    })
  }

  // 4. Questions about timeline inconsistencies
  if (context.caseAnchor.timelineIssues.length > 0) {
    context.caseAnchor.timelineIssues.forEach(issue => {
      questions.push({
        question: `The court notes a timeline concern: ${issue.event}. You stated it was ${issue.claimedTime}, but we have reason to believe otherwise. Can you clarify?`,
        target: 'personA', // Would need to determine speaker
        purpose: 'investigate',
        reasoning: 'Address timeline discrepancy',
      })
    })
  }

  return questions
}

/**
 * Generate the NEXT BEST question for judge to ask
 * Returns single most important question based on investigation state
 */
export function generateNextBestQuestion(
  context: QuestionContext
): TargetedQuestion | null {
  // Priority 1: Address most severe contradictions
  const severeContradictions = context.caseAnchor.contradictions.filter(
    c => c.severity === 'severe'
  )
  if (severeContradictions.length > 0) {
    const contradiction = severeContradictions[0]
    return {
      question: `The court has identified a critical inconsistency in your statements. ${contradiction.speakers[0]} stated "${contradiction.statement}" but also stated "${contradiction.contradiction}". This is contradictory. Which is accurate?`,
      target: contradiction.speakers[0] === context.personAName ? 'personA' : 'personB',
      purpose: 'challenge',
      reasoning: 'Address severe contradiction that undermines credibility',
    }
  }

  // Priority 2: Emotional clarification
  if (context.caseAnchor.emotionalContext.intensity > 70) {
    return {
      question: `The court observes significant emotion around this issue. ${context.personAName}, can you explain what this situation means to you? What are you most concerned about?`,
      target: 'personA',
      purpose: 'explore_emotion',
      reasoning: 'Investigate emotional core before verdict',
    }
  }

  // Priority 3: Unresolved questions
  const unresolvedQuestion = context.caseAnchor.unresolvedQuestions.find(
    q => q.status === 'asked'
  )
  if (unresolvedQuestion) {
    return {
      question: unresolvedQuestion.question,
      target: unresolvedQuestion.askedOf === context.personAName ? 'personA' : 'personB',
      purpose: 'clarify',
      reasoning: 'Follow up on previously asked question',
    }
  }

  // Priority 4: Timeline issues
  if (context.caseAnchor.timelineIssues.length > 0) {
    const issue = context.caseAnchor.timelineIssues[0]
    return {
      question: `The court notes a timeline concern regarding "${issue.event}". You claimed this occurred ${issue.claimedTime}, but there is conflicting information. Please explain.`,
      target: 'personA', // Would need context to determine
      purpose: 'investigate',
      reasoning: 'Resolve timeline discrepancy',
    }
  }

  // No priority questions - case is clear
  return null
}

/**
 * Generate follow-up questions based on most recent statement
 */
export function generateFollowUpQuestion(
  lastStatement: string,
  speaker: 'personA' | 'personB',
  context: QuestionContext
): TargetedQuestion | null {
  const personName = speaker === 'personA' ? context.personAName : context.personBName

  // Look for emotional words
  const emotionalKeywords = [
    'felt',
    'felt',
    'upset',
    'hurt',
    'angry',
    'frustrated',
    'disappointed',
    'betrayed',
  ]
  const hasEmotional = emotionalKeywords.some(keyword =>
    lastStatement.toLowerCase().includes(keyword)
  )

  if (hasEmotional) {
    return {
      question: `${personName}, you mentioned feeling [emotion]. Can you describe specifically what led to that feeling? What did the other party do or say?`,
      target: speaker,
      purpose: 'explore_emotion',
      reasoning: 'Deepen emotional understanding from their recent statement',
    }
  }

  // Look for claims that seem inconsistent with earlier statements
  if (context.caseAnchor.contradictions.length > 0) {
    return {
      question: `${personName}, your current statement appears to differ from what you said earlier. Can you reconcile these two positions?`,
      target: speaker,
      purpose: 'challenge',
      reasoning: 'Address potential contradiction in their testimony',
    }
  }

  return null
}

/**
 * Generate contextual judge observation/question
 * NOT generic - tied to actual case facts
 */
export function generateJudgeObservation(
  context: QuestionContext
): string {
  const issues = []

  // Observation about contradictions
  if (context.caseAnchor.contradictions.length > 0) {
    issues.push(
      `The court has noted ${context.caseAnchor.contradictions.length} significant inconsistenc${context.caseAnchor.contradictions.length > 1 ? 'ies' : 'y'} in the testimony.`
    )
  }

  // Observation about emotional core
  if (context.caseAnchor.emotionalContext.primaryEmotion !== 'unknown') {
    issues.push(
      `The emotional core appears to center on ${context.caseAnchor.emotionalContext.primaryEmotion}.`
    )
  }

  // Observation about timeline
  if (context.caseAnchor.timelineIssues.length > 0) {
    issues.push(`There are timeline concerns that need clarification.`)
  }

  // Observation about patterns
  if (context.judgeMemory.patterns.personAPatterns.length > 0) {
    issues.push(`A pattern has emerged in ${context.personAName}'s statements.`)
  }

  if (issues.length === 0) {
    return `The court is listening carefully to both parties' perspectives.`
  }

  return `${issues[0]} ${issues.length > 1 ? `Additionally, ${issues[1]}` : ''}`
}
