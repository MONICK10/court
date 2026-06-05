/**
 * INVESTIGATION-FOCUSED GEMINI SERVICE
 * 
 * Prompts AI to act as an investigation orchestrator,
 * not a roleplay dialogue generator.
 * 
 * AI analyzes state and makes structured decisions.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { CourtState } from './newJudgeOrchestrator'
import { CaseAnchor, getCaseAnchorContext } from './caseAnchor'
import { JudgeConfidence } from './judgeConfidence'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Generate judge analysis and next action
 * 
 * This is the CORE decision function.
 * Tells us what the judge should do next.
 */
export async function analyzeCourtStateAndDecide(
  state: CourtState
): Promise<{
  analysis: string
  nextAction: 'ask_contradiction' | 'clarify_question' | 'explore_emotional' | 'probe_timeline' | 'deliver_verdict'
  targetPerson: 'personA' | 'personB' | null
  reasoning: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const caseContext = getCaseAnchorContext(state.caseAnchor)
  const recentMessages = state.messages
    .slice(-5)
    .map(m => `${m.speaker}: ${m.content}`)
    .join('\n')

  const prompt = `You are an analytical judge conducting an investigation into a relationship dispute.

CASE ANCHOR (Investigation Foundation):
${caseContext}

JUDGE'S CONFIDENCE ASSESSMENT:
- Overall confidence: ${state.judgeConfidence.overall}%
- Clarity level: ${state.judgeConfidence.clarityLevel}%
- Emotional understanding: ${state.judgeConfidence.emotionalUnderstanding}%
- Contradictions remaining: ${state.judgeConfidence.contradictionsRemaining}
- Ready for verdict: ${state.judgeConfidence.readyForVerdict}

RECENT COURTROOM EXCHANGE:
${recentMessages}

YOUR TASK:
Analyze the current investigation state and determine the SINGLE MOST IMPORTANT action:

1. Are there unresolved contradictions? (yes/no)
2. Are there unresolved questions? (yes/no) 
3. Is emotional understanding incomplete? (yes/no)
4. Are timeline inconsistencies present? (yes/no)
5. Is clarity sufficient for verdict? (yes/no)

Based on priorities, determine which investigation action to take:
- 'ask_contradiction' if contradictions exist and need direct challenge
- 'clarify_question' if questions remain unanswered
- 'explore_emotional' if emotional core is unclear
- 'probe_timeline' if timeline has inconsistencies
- 'deliver_verdict' if clarity >= 75% and contradictions <= 1

RESPOND with JSON only, no markdown:
{
  "analysis": "Brief assessment of current state",
  "nextAction": "one of the 5 actions above",
  "targetPerson": "personA or personB or null",
  "reasoning": "Why this action is necessary"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback
    return {
      analysis: 'Investigation ongoing',
      nextAction: 'clarify_question',
      targetPerson: 'personA',
      reasoning: 'Continue gathering information',
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    return {
      analysis: 'Investigation ongoing',
      nextAction: 'clarify_question',
      targetPerson: 'personA',
      reasoning: 'API error - continuing investigation',
    }
  }
}

/**
 * Generate a specific judge question
 * 
 * Input: What kind of question we need
 * Output: Contextual question anchored to case
 */
export async function generateTargetedJudgeQuestion(
  state: CourtState,
  questionType: 'contradiction' | 'clarification' | 'emotional' | 'timeline',
  targetPerson: 'personA' | 'personB'
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const personName =
    targetPerson === 'personA'
      ? state.caseSetup.personAName
      : state.caseSetup.personBName

  const caseContext = getCaseAnchorContext(state.caseAnchor)

  let questionPrompt = ''

  switch (questionType) {
    case 'contradiction':
      const contradiction = state.caseAnchor.contradictions.find(c => !c.resolved)
      questionPrompt = `
The judge has identified a contradiction:
- Statement A: "${contradiction?.claim}"
- Statement B: "${contradiction?.contradictingClaim}"

Generate a DIRECT, CONFRONTATIONAL question that:
1. References both statements
2. Asks ${personName} to explain the discrepancy
3. Is NOT generic courtroom filler
4. Puts pressure on the contradiction

Keep it 1-2 sentences.`
      break

    case 'clarification':
      const unresolved = state.caseAnchor.unresolvedQuestions.find(q => q.status !== 'resolved')
      questionPrompt = `
The judge needs to clarify:
${unresolved?.question || 'A key detail is unclear'}

Generate a SPECIFIC follow-up question that:
1. References actual case details
2. Seeks deeper truth
3. Is anchored to the dispute
4. Targets ${personName}

Keep it 1-2 sentences.`
      break

    case 'emotional':
      questionPrompt = `
The judge senses ${state.caseAnchor.primaryEmotion} underlying this dispute.

Generate an EMPATHETIC but PROBING question that:
1. Acknowledges the emotion
2. Asks ${personName} to describe when it started
3. Seeks the emotional root cause
4. Is genuinely curious, not clinical

Keep it 1-2 sentences.`
      break

    case 'timeline':
      const timeline = state.caseAnchor.timelineIssues[0]
      questionPrompt = `
Timeline inconsistency detected:
Event: ${timeline?.event || 'Disputed event'}
Claimed time: ${timeline?.claimedTime || 'Timeline unclear'}

Generate a DIRECT question that:
1. Challenges the timeline claim
2. References the inconsistency
3. Asks ${personName} to explain
4. Presumes some discrepancy exists

Keep it 1-2 sentences.`
      break
  }

  const prompt = `${caseContext}

${questionPrompt}

Response: (just the question, no explanation)`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Question generation error:', error)
    return `${personName}, can you provide more detail about that?`
  }
}

/**
 * Generate a specific lawyer response
 * 
 * Lawyers respond to judge questions or challenges
 * They must defend actual claims, not generate filler
 */
export async function generateLawyerResponse(
  state: CourtState,
  lawyerPerson: 'personA' | 'personB',
  judgeMessage: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const personName =
    lawyerPerson === 'personA'
      ? state.caseSetup.personAName
      : state.caseSetup.personBName

  const position =
    lawyerPerson === 'personA'
      ? state.caseAnchor.personAPosition
      : state.caseAnchor.personBPosition

  const caseContext = getCaseAnchorContext(state.caseAnchor)

  const prompt = `You are the lawyer defending ${personName}.

CASE CONTEXT:
${caseContext}

YOUR CLIENT'S POSITION:
${position}

THE JUDGE JUST SAID:
"${judgeMessage}"

Your task: Generate a BRIEF, STRATEGIC defense that:
1. Addresses the judge's specific point
2. Defends ${personName}'s actual claim
3. Does NOT generate filler like "the situation is nuanced"
4. Stays emotionally intelligent and sharp
5. Challenges the judge's premise if appropriate

CRITICAL: Keep response to 1-3 sentences MAX.
CRITICAL: Reference actual case details, not generic rhetoric.

Response: (just the lawyer's defense, no explanation)`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Lawyer response error:', error)
    return `My client stands by their statement.`
  }
}

/**
 * Detect contradictions using AI analysis
 * 
 * Analyzes statements to find logical contradictions
 */
export async function analyzeForContradictions(
  personAStatement: string,
  personBStatement: string,
  caseTitle: string
): Promise<Array<{ claim: string; contradiction: string; severity: string }>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Case: ${caseTitle}

Person A says: "${personAStatement}"
Person B says: "${personBStatement}"

Identify logical contradictions between these statements.

For each contradiction found:
- What is the conflicting claim?
- What is the contradiction?
- How severe is it (minor/moderate/severe)?

Respond with JSON only:
[
  {
    "claim": "What A/B claimed",
    "contradiction": "What contradicts it",
    "severity": "minor/moderate/severe"
  }
]

If no contradictions, respond with empty array: []`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (error) {
    console.error('Contradiction analysis error:', error)
    return []
  }
}

/**
 * Detect primary emotional theme
 */
export async function analyzeEmotionalContext(
  personAStatement: string,
  personBStatement: string
): Promise<{ primaryEmotion: string; intensity: number }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Analyze the emotional context of this dispute:

Person A: "${personAStatement}"
Person B: "${personBStatement}"

Identify:
1. What is the PRIMARY emotion underlying this conflict? (e.g., hurt, anger, betrayal, frustration)
2. How intense is it? (0-100)

Respond with JSON only:
{
  "primaryEmotion": "emotion name",
  "intensity": number
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { primaryEmotion: 'unknown', intensity: 50 }
  } catch (error) {
    console.error('Emotional analysis error:', error)
    return { primaryEmotion: 'unknown', intensity: 50 }
  }
}
