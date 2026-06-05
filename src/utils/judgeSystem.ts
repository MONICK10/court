import { CourtMood } from '@/types'

export interface VerdictData {
  winner: 'A' | 'B' | 'draw'
  winnerConfidence: number
  verdict: string
  emotionalSummary: string
  redFlags: string[]
  strengthsRecognized: string[]
  toxicityScore: number
  communicationScore: number
  emotionalCompatibility: number
  survivalChance: number
  funniest: string
  recommendation: string
}

// Mock verdict system (fallback)
const mockVerdicts = [
  {
    winner: 'A' as const,
    verdict: 'The court finds in favor of {personA}. {personB} demonstrated a troubling pattern of neglect.',
    emotionalSummary: '{personA} has suffered emotional abandonment. This is not acceptable.',
    redFlags: ['Chronic inattention', 'Dismissive behavior', 'Poor communication', 'Emotional unavailability'],
    strengthsRecognized: ['Clear expression of needs', 'Patience and documentation', 'Emotional awareness'],
    toxicityScore: 68,
    communicationScore: 42,
    emotionalCompatibility: 35,
    survivalChance: 38,
    funniest: 'The defendant wasn\'t even trying to hide the negligence.',
  },
  {
    winner: 'B' as const,
    verdict: 'The court finds in favor of {personB}. While {personA}\'s feelings are valid, context matters.',
    emotionalSummary: '{personB} was operating under constraints {personA} didn\'t fully appreciate. This is a communication failure on both sides.',
    redFlags: ['Unmet expectations', 'Assumption-based conflict', 'Lack of benefit of the doubt', 'Selective memory'],
    strengthsRecognized: ['Willingness to explain', 'Genuine commitment', 'Effort despite challenges'],
    toxicityScore: 54,
    communicationScore: 48,
    emotionalCompatibility: 52,
    survivalChance: 58,
    funniest: 'The plaintiff was so convinced of guilt, they never asked for the full story.',
  },
  {
    winner: 'draw' as const,
    verdict: 'This court finds both parties equally culpable. Neither side is innocent.',
    emotionalSummary: 'Both parties failed in communication, empathy, and perspective-taking. This is textbook relationship dysfunction.',
    redFlags: ['Mutual blame', 'Defensive patterns', 'Poor listening', 'Emotional escalation', 'Assumption-based conflict'],
    strengthsRecognized: ['Both care about the outcome', 'Willingness to participate', 'Desire for resolution'],
    toxicityScore: 71,
    communicationScore: 38,
    emotionalCompatibility: 42,
    survivalChance: 45,
    funniest: 'Both sides were so focused on being right, they forgot to be together.',
  },
]

// Generate mock verdict (fallback when AI is not available)
export function generateMockVerdict(
  personA: string,
  personB: string,
  mood: CourtMood
): VerdictData {
  const baseVerdict = mockVerdicts[Math.floor(Math.random() * mockVerdicts.length)]
  
  // Adjust based on mood
  const adjustments: Record<CourtMood, { toxicityAdjust: number; funniestAdjust: string }> = {
    savage: { toxicityAdjust: 15, funniestAdjust: ' (The defendant was absolutely roasted.)' },
    funny: { toxicityAdjust: -10, funniestAdjust: ' (This relationship survives on memes alone.)' },
    serious: { toxicityAdjust: 0, funniestAdjust: '' },
    drama: { toxicityAdjust: 10, funniestAdjust: ' (The drama is cinematic and unresolved.)' },
  }

  const adjust = adjustments[mood]

  return {
    winner: baseVerdict.winner,
    winnerConfidence: baseVerdict.winner === 'A' ? 68 : baseVerdict.winner === 'B' ? 72 : 50,
    verdict: baseVerdict.verdict
      .replace('{personA}', personA)
      .replace('{personB}', personB),
    emotionalSummary: baseVerdict.emotionalSummary
      .replace('{personA}', personA)
      .replace('{personB}', personB),
    redFlags: baseVerdict.redFlags,
    strengthsRecognized: baseVerdict.strengthsRecognized,
    toxicityScore: Math.min(100, baseVerdict.toxicityScore + adjust.toxicityAdjust),
    communicationScore: baseVerdict.communicationScore + (Math.random() * 10 - 5),
    emotionalCompatibility: baseVerdict.emotionalCompatibility + (Math.random() * 15 - 7),
    survivalChance: baseVerdict.survivalChance + (Math.random() * 10 - 5),
    funniest: baseVerdict.funniest + adjust.funniestAdjust,
    recommendation: buildRecommendation(baseVerdict.winner, personA, personB),
  }
}

// Build AI verdict prompt (for future OpenAI/Claude integration)
export function buildVerdictPrompt(
  personA: string,
  personB: string,
  argumentA: string,
  argumentB: string,
  mood: CourtMood,
  lawyerResponsesA: string[],
  lawyerResponsesB: string[]
): string {
  const moodContext: Record<CourtMood, string> = {
    savage: 'Make observations sharp and unforgiving. Call out contradictions brutally.',
    funny: 'Keep a lighter tone while maintaining emotional truth. Occasional witty observations.',
    serious: 'Focus on emotional intelligence and nuanced analysis. Avoid humor.',
    drama: 'Heightened emotional language. Cinematic delivery. Build dramatic tension.',
  }

  return `You are Judge Dramatic, an emotionally intelligent AI courtroom judge delivering a verdict on a relationship dispute.

CASE PARTICIPANTS:
- ${personA} (Plaintiff)
- ${personB} (Defendant)

ORIGINAL ARGUMENTS:
${personA}: "${argumentA}"

${personB}: "${argumentB}"

COURTROOM RESPONSES:
${personA}'s Lawyer: "${lawyerResponsesA.join(' | ')}"

${personB}'s Lawyer: "${lawyerResponsesB.join(' | ')}"

YOUR TASK:
Deliver a comprehensive verdict that:
1. Identifies the winner (${personA}, ${personB}, or Neither)
2. Provides emotional summary (what really happened beneath the surface)
3. Lists red flags in their relationship dynamic
4. Recognizes genuine strengths or efforts
5. Scores metrics (toxicity 0-100, communication 0-100, emotional compatibility 0-100, survival chance 0-100)
6. Identifies one funniest observation
7. Provides a recommendation

TONE GUIDANCE:
${moodContext[mood]}

IMPORTANT:
- Be emotionally observant, not dismissive
- Acknowledge valid feelings on both sides
- Point out communication failures, not character flaws
- Keep verdict under 150 words
- Make it cinematic and memorable

Format your response as JSON with these fields:
{
  "winner": "A" | "B" | "draw",
  "verdict": "...",
  "emotionalSummary": "...",
  "redFlags": ["...", "..."],
  "strengthsRecognized": ["...", "..."],
  "toxicityScore": 0-100,
  "communicationScore": 0-100,
  "emotionalCompatibility": 0-100,
  "survivalChance": 0-100,
  "funniest": "...",
  "recommendation": "..."
}`
}

// Parse AI response into VerdictData
export function parseAIVerdict(jsonResponse: string): VerdictData {
  try {
    const parsed = JSON.parse(jsonResponse)
    return {
      winner: parsed.winner,
      winnerConfidence: parsed.winner === 'A' ? 75 : parsed.winner === 'B' ? 72 : 50,
      verdict: parsed.verdict,
      emotionalSummary: parsed.emotionalSummary,
      redFlags: parsed.redFlags || [],
      strengthsRecognized: parsed.strengthsRecognized || [],
      toxicityScore: Math.min(100, Math.max(0, parsed.toxicityScore)),
      communicationScore: Math.min(100, Math.max(0, parsed.communicationScore)),
      emotionalCompatibility: Math.min(100, Math.max(0, parsed.emotionalCompatibility)),
      survivalChance: Math.min(100, Math.max(0, parsed.survivalChance)),
      funniest: parsed.funniest,
      recommendation: parsed.recommendation,
    }
  } catch (error) {
    console.error('Failed to parse AI verdict:', error)
    // Fallback to mock if AI parsing fails
    return generateMockVerdict('Person A', 'Person B', 'serious')
  }
}

// Helper to build recommendation
function buildRecommendation(winner: 'A' | 'B' | 'draw', personA: string, personB: string): string {
  if (winner === 'draw') {
    return 'Both parties need to invest in honest communication, active listening, and building mutual trust. Consider couples counseling.'
  }
  return `${personA} needs to be more aware of impact. ${personB} needs to advocate for their needs clearly. Both need to listen better.`
}

/**
 * Generate judge reaction to a new user statement during interactive courtroom
 */
export function generateJudgeReaction(session: any, speaker: 'A' | 'B'): string {
  const reactions = [
    `The court is listening intently. This emotional revelation adds important context.`,
    `Interesting. The plaintiff's account includes nuances not previously mentioned.`,
    `The court notes this clarification. The emotional reality becomes clearer.`,
    `This testimony demonstrates the depth of impact. The court takes this into account.`,
    `The defendant provides crucial context that the court was not aware of.`,
    `The plaintiff articulates the emotional injury with clarity. Duly noted.`,
    `This adds complexity to the narrative. The court adjusts its understanding.`,
    `The court observes that this new statement contradicts earlier testimony. Explain.`,
    `Compelling testimony. The court will weigh this heavily in its decision.`,
    `This emotional honesty strengthens the case presented.`,
  ]
  
  return reactions[Math.floor(Math.random() * reactions.length)]
}

/**
 * Enhanced mock verdict that considers full interactive session context
 */
export function generateMockVerdictWithContext(
  personA: string,
  personB: string,
  mood: CourtMood,
  context?: {
    aStatements?: string
    bStatements?: string
    contradictions?: any[]
    judgeNotes?: string[]
  }
): VerdictData {
  const baseVerdicts = mockVerdicts.slice()
  
  // Select verdict based on session context
  let selectedVerdict = baseVerdicts[Math.floor(Math.random() * baseVerdicts.length)]
  
  // Adjust based on contradictions
  if (context?.contradictions && context.contradictions.length > 2) {
    // If many contradictions, lean toward draw
    selectedVerdict = baseVerdicts[2]
  }
  
  // Apply personalization
  const verdict: VerdictData = {
    ...selectedVerdict,
    winnerConfidence: selectedVerdict.winner === 'A' ? 68 : selectedVerdict.winner === 'B' ? 72 : 50,
    recommendation: buildRecommendation(selectedVerdict.winner, personA, personB),
    verdict: selectedVerdict.verdict
      .replace('{personA}', personA)
      .replace('{personB}', personB),
    emotionalSummary: selectedVerdict.emotionalSummary
      .replace('{personA}', personA)
      .replace('{personB}', personB),
    funniest: selectedVerdict.funniest
      .replace('{personA}', personA)
      .replace('{personB}', personB),
  }
  
  // Adjust scores based on mood
  if (mood === 'savage') {
    verdict.toxicityScore = Math.min(100, verdict.toxicityScore + 15)
    verdict.communicationScore = Math.max(0, verdict.communicationScore - 10)
  } else if (mood === 'funny') {
    verdict.funniest += ' (And it was hilarious.)'
  } else if (mood === 'drama') {
    verdict.emotionalSummary += ' This is peak relationship drama.'
  }
  
  return verdict
}

export { }
