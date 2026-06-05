# VERDICT SYSTEM SPECIFICATION

This document describes how to generate verdicts based on courtroom data collected throughout the case.

---

## Verdict Context

Throughout the courtroom, the memory system collects data in `judgmentContext`:

```typescript
judgmentContext: {
  strongPointsA: string[]      // Arguments that held up
  strongPointsB: string[]      // Counterarguments
  redFlagsA: string[]          // Problematic patterns
  redFlagsB: string[]          // Warning signs
  communicationPatterns: [],   // How they interact
  emotionalHealthIndicators: [] // Psychological state
}
```

This context should be populated throughout the case via the orchestrator.

---

## Three Verdict Approaches

### Approach 1: Template-Based (Easiest)

Pre-written verdicts with variable substitution.

**Advantages:**
- No AI latency
- Deterministic
- Easy to customize per mood

**Disadvantages:**
- Limited to pre-written variations
- Doesn't feel personalized to case

### Approach 2: Rule-Based (Medium)

Generate verdict based on collected metrics and rules.

**Advantages:**
- Somewhat personalized
- No AI calls
- Reproducible

**Disadvantages:**
- Complex rules to write
- Can feel mechanical

### Approach 3: AI-Generated (Best)

Use Gemini to generate contextual, unique verdict.

**Advantages:**
- Highly personalized
- Feels cinematic
- Can handle any case
- Emotionally resonant

**Disadvantages:**
- AI latency at end
- Slightly more expensive

---

## Verdict Structure

All verdicts should include:

```typescript
interface Verdict {
  winner: 'A' | 'B' | 'draw'
  winnerConfidence: number // 0-100
  
  // Main ruling
  verdict: string // 2-3 sentences
  
  // Emotional understanding
  emotionalSummary: string // 1-2 sentences
  
  // Specific findings
  redFlags: string[] // Things this court noted
  strengthsRecognized: string[] // Good things on both sides
  
  // Relationship metrics (0-100)
  toxicityScore: number
  communicationScore: number
  emotionalCompatibility: number
  survivalChance: number
  
  // Mood-specific content
  funniest: string // Best quote or observation
  
  // Recommendation
  recommendation: string // What should happen next
}
```

---

## Implementation: AI-Generated Verdicts

### 1. Build Verdict Prompt

```typescript
// src/utils/verdictService.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateVerdictAI(
  memory: CourtroomMemoryState
): Promise<Verdict> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = buildVerdictPrompt(memory)

  const result = await model.generateContent(prompt)
  
  // Parse JSON from response
  const verdictJSON = extractJSON(result.response.text())
  
  return verdictJSON as Verdict
}

function buildVerdictPrompt(memory: CourtroomMemoryState): string {
  const personA = memory.caseSetup.personAName
  const personB = memory.caseSetup.personBName
  const mood = memory.caseSetup.mood

  return `
You are rendering a final verdict in an AI relationship courtroom drama.

CASE DETAILS:
- ${personA} (Side A) argues: ${memory.caseSetup.personAArgument.substring(0, 100)}...
- ${personB} (Side B) argues: ${memory.caseSetup.personBArgument.substring(0, 100)}...

COURTROOM SUMMARY:
- Phase: ${memory.currentPhase}
- Rounds: ${memory.round}
- Total messages: ${memory.conversationHistory.length}
- User A statements: ${memory.userStatements.A.length}
- User B statements: ${memory.userStatements.B.length}
- Contradictions found: ${memory.contradictions.length}
- Emotional signals: ${memory.emotionalSignals.length}

CONTRADICTIONS IDENTIFIED:
${memory.contradictions.map(c => `- ${c.insight}`).join('\n') || 'None detected'}

EMOTIONAL TRAJECTORY:
- ${personA}: ${getEmotionalTrajectory(memory.emotionalTrajectory.A)}
- ${personB}: ${getEmotionalTrajectory(memory.emotionalTrajectory.B)}

UNRESOLVED QUESTIONS:
${memory.unresolvedQuestions.map(q => `- ${q.question}`).join('\n') || 'None'}

MOOD: ${mood}

YOUR TASK:
Generate a final verdict for this relationship case. The verdict should:

1. Be cinematic and emotionally resonant
2. Reflect what actually happened in the courtroom
3. Reference specific statements or contradictions
4. Feel fair and thoughtful
5. Match the "${mood}" mood (if savage, be cutting; if funny, be witty; if serious, be balanced; if drama, be theatrical)

DO NOT use generic templates. This verdict should be specific to this case.

IMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation, just JSON.

Format:
{
  "winner": "A" | "B" | "draw",
  "winnerConfidence": 0-100,
  "verdict": "2-3 sentence ruling",
  "emotionalSummary": "1-2 sentence emotional understanding",
  "redFlags": ["flag1", "flag2", ...],
  "strengthsRecognized": ["strength1", "strength2", ...],
  "toxicityScore": 0-100,
  "communicationScore": 0-100,
  "emotionalCompatibility": 0-100,
  "survivalChance": 0-100,
  "funniest": "Best quote or observation",
  "recommendation": "What should happen next"
}
`.trim()
}

function getEmotionalTrajectory(trajectory: Array<{ phase: string; tone: string }>): string {
  if (trajectory.length === 0) return 'neutral'
  const tones = trajectory.map(t => t.tone)
  const latest = tones[tones.length - 1]
  const trend = trajectory.length > 1 ? 'escalating' : 'established'
  return `${latest} (${trend})`
}

function extractJSON(text: string): object {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}
```

### 2. Update Orchestrator for Verdict

```typescript
// src/utils/courtroomOrchestrator.ts
import { generateVerdictAI } from './verdictService'

export async function generateVerdictResponse(
  memory: CourtroomMemoryState,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  let verdictText = ''

  try {
    // Try AI generation
    const verdict = await generateVerdictAI(memory)
    verdictText = formatVerdictForDisplay(verdict)
    
    // Store verdict in memory for later retrieval
    localStorage.setItem(`verdict-${memory.sessionId}`, JSON.stringify(verdict))
  } catch (error) {
    console.warn('AI verdict generation failed, using template:', error)
    verdictText = generateTemplateVerdict(memory)
  }

  return {
    speaker: 'judge',
    message: verdictText,
    phase: 'verdict',
    action: 'deliver_verdict',
    allowUserInput: false,
    messageDuration: 5000,
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: 95,
      tone: 'calm',
    },
  }
}

function formatVerdictForDisplay(verdict: Verdict): string {
  return `
${verdict.verdict}

${verdict.emotionalSummary}

The court finds:
- Toxicity Score: ${verdict.toxicityScore}%
- Communication Quality: ${verdict.communicationScore}%
- Emotional Compatibility: ${verdict.emotionalCompatibility}%
- Survival Chance: ${verdict.survivalChance}%

${verdict.recommendation}
`.trim()
}
```

### 3. Add to API Endpoint

```typescript
// src/app/api/orchestrate/route.ts
export async function POST(request: NextRequest) {
  // ... existing code ...

  if (updatedMemory.currentPhase === 'verdict') {
    const verdictResponse = await generateVerdictResponse(updatedMemory, context)
    
    return NextResponse.json({
      success: true,
      response: verdictResponse,
      updatedMemory,
      isVerdict: true,
      verdictData: await getStoredVerdict(updatedMemory.sessionId),
    })
  }

  // ... rest of code ...
}

async function getStoredVerdict(sessionId: string) {
  // Retrieve from storage/database
}
```

---

## Approach 1: Template-Based Verdicts

If you want to avoid AI calls for verdict, use pre-written templates:

```typescript
export const verdictTemplates = {
  decisive: [
    {
      winner: 'A' as const,
      template: `${personA} has presented a compelling case. ${personB}'s pattern of {redFlag} is undeniable. 
      
      The court recognizes that ${personB} {strength}, but {personA} has suffered real consequences.
      
      Verdict: In favor of ${personA}. The relationship requires {recommendation}.`,
    },
    {
      winner: 'B' as const,
      template: `While ${personA} expresses legitimate concerns, ${personB}'s explanation provides important context.
      
      The issue here is not malice but miscommunication. Both parties acted reasonably given their understanding.
      
      Verdict: In favor of ${personB}. The court recommends {recommendation}.`,
    },
  ],

  messy: [
    {
      winner: 'draw' as const,
      template: `This court finds both parties equally responsible for the breakdown.
      
      ${personA} failed to {personA_failing}. ${personB} failed to {personB_failing}.
      
      Neither side is innocent. Verdict: Draw. Recommendation: {recommendation}.`,
    },
  ],
}

export function generateTemplateVerdict(memory: CourtroomMemoryState): Verdict {
  const personA = memory.caseSetup.personAName
  const personB = memory.caseSetup.personBName
  const mood = memory.caseSetup.mood

  // Choose template based on contradictions, emotional tone, etc.
  const template = selectTemplate(memory)
  
  // Fill in variables
  const verdict = template.template
    .replace('{personA}', personA)
    .replace('{personB}', personB)
    .replace('{redFlag}', memory.judgmentContext.redFlagsA[0] || 'behavior')
    .replace('{strength}', memory.judgmentContext.strengthsRecognized[0] || 'tried')
    .replace('{recommendation}', generateRecommendation(memory))

  return {
    winner: template.winner,
    winnerConfidence: 65 + Math.random() * 20,
    verdict: verdict.substring(0, 300),
    emotionalSummary: generateEmotionalSummary(memory),
    redFlags: memory.judgmentContext.redFlagsA.concat(memory.judgmentContext.redFlagsB),
    strengthsRecognized: memory.judgmentContext.strengthsRecognized,
    toxicityScore: calculateToxicityScore(memory),
    communicationScore: calculateCommunicationScore(memory),
    emotionalCompatibility: 50 + Math.random() * 30,
    survivalChance: calculateSurvivalChance(memory),
    funniest: generateFunnyObservation(memory),
    recommendation: generateRecommendation(memory),
  }
}

function selectTemplate(memory: CourtroomMemoryState): VerdictTemplate {
  const contradictionCount = memory.contradictions.length
  const emotionalIntensity = memory.emotionalSignals.reduce((sum, s) => sum + s.intensity, 0) / Math.max(1, memory.emotionalSignals.length)

  if (contradictionCount > 3) {
    return verdictTemplates.decisive[Math.random() > 0.5 ? 0 : 1]
  } else {
    return verdictTemplates.messy[0]
  }
}
```

---

## Approach 2: Rule-Based Verdicts

```typescript
export function generateRuleBasedVerdict(memory: CourtroomMemoryState): Verdict {
  const personA = memory.caseSetup.personAName
  const personB = memory.caseSetup.personBName

  // Calculate winner based on rules
  const scoreA = calculateParticipationScore(memory, 'A')
  const scoreB = calculateParticipationScore(memory, 'B')
  
  let winner: 'A' | 'B' | 'draw'
  if (scoreA > scoreB + 10) winner = 'A'
  else if (scoreB > scoreA + 10) winner = 'B'
  else winner = 'draw'

  // Calculate metrics
  const toxicityScore = Math.min(100, memory.emotionalSignals.reduce((sum, s) => sum + s.intensity, 0) / Math.max(1, memory.emotionalSignals.length))
  const communicationScore = 100 - (memory.contradictions.length * 15)
  const emotionalCompatibility = 50 + (memory.round * 5)
  const survivalChance = winner === 'draw' ? 50 : winner === 'A' ? 40 : 60

  return {
    winner,
    winnerConfidence: Math.abs(scoreA - scoreB) / 10,
    verdict: `The court finds in favor of ${winner === 'draw' ? 'both parties equally' : winner === 'A' ? personA : personB}.`,
    emotionalSummary: `This case revealed ${memory.contradictions.length} contradictions and ${memory.emotionalSignals.length} emotional moments.`,
    redFlags: memory.judgmentContext.redFlagsA.concat(memory.judgmentContext.redFlagsB),
    strengthsRecognized: memory.judgmentContext.strengthsRecognized,
    toxicityScore,
    communicationScore: Math.max(0, communicationScore),
    emotionalCompatibility,
    survivalChance,
    funniest: memory.conversationHistory.slice(-1)[0]?.message || 'No comment',
    recommendation: generateRecommendation(memory),
  }
}

function calculateParticipationScore(memory: CourtroomMemoryState, speaker: 'A' | 'B'): number {
  const statements = speaker === 'A' ? memory.userStatements.A : memory.userStatements.B
  const avgLength = statements.reduce((sum, s) => sum + s.content.length, 0) / Math.max(1, statements.length)
  return (statements.length * 10) + (avgLength / 20)
}
```

---

## Scoring Functions

```typescript
function calculateToxicityScore(memory: CourtroomMemoryState): number {
  const emotionalIntensities = memory.emotionalSignals.map(s => s.intensity)
  if (emotionalIntensities.length === 0) return 0
  const avg = emotionalIntensities.reduce((a, b) => a + b) / emotionalIntensities.length
  return Math.min(100, avg * 1.2) // Slightly amplify
}

function calculateCommunicationScore(memory: CourtroomMemoryState): number {
  // More contradictions = worse communication
  const baseScore = 80
  const contradictionPenalty = memory.contradictions.length * 5
  return Math.max(0, baseScore - contradictionPenalty)
}

function calculateSurvivalChance(memory: CourtroomMemoryState): number {
  const factors = {
    communicationScore: calculateCommunicationScore(memory) * 0.4,
    emotionalTone: (100 - memory.emotionalSignals.reduce((sum, s) => sum + s.intensity, 0) / Math.max(1, memory.emotionalSignals.length)) * 0.3,
    participationLevel: Math.min(100, (memory.userStatements.A.length + memory.userStatements.B.length) * 10) * 0.2,
    phaseReached: (memory.currentPhase === 'verdict' ? 20 : 0),
  }
  
  return Object.values(factors).reduce((a, b) => a + b, 0)
}

function generateRecommendation(memory: CourtroomMemoryState): string {
  if (memory.emotionalSignals.length > 5) {
    return 'This court recommends couples counseling and communication coaching.'
  } else if (memory.contradictions.length > 2) {
    return 'This court recommends addressing the patterns of miscommunication before moving forward.'
  } else {
    return 'This court recommends continued dialogue and mutual effort.'
  }
}

function generateEmotionalSummary(memory: CourtroomMemoryState): string {
  const emotionalLevel = memory.emotionalSignals.reduce((sum, s) => sum + s.intensity, 0) / Math.max(1, memory.emotionalSignals.length)
  
  if (emotionalLevel > 75) {
    return 'This case revealed deep emotional wounds that require acknowledgment and healing.'
  } else if (emotionalLevel > 50) {
    return 'Both parties expressed genuine hurt, but the roots of the conflict remain unclear.'
  } else {
    return 'While presented logically, the emotional core of this relationship issue lies beneath the surface.'
  }
}

function generateFunnyObservation(memory: CourtroomMemoryState): string {
  const observations = [
    'The contradictions in this case could fill a courtroom volume.',
    'If only communication could be as passionate as the arguments here.',
    'This court has seen clearer timelines in dream sequences.',
    'Both parties are right... which means they\'re both wrong.',
  ]
  
  return observations[Math.floor(Math.random() * observations.length)]
}
```

---

## Verdict Display Component

```tsx
// components/VerdictCard.tsx
'use client'

import { Verdict } from '@/types'
import { motion } from 'framer-motion'

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  return (
    <motion.div
      className="verdict-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="verdict-header">
        <h2 className="verdict-title">VERDICT</h2>
        <p className="verdict-winner">
          {verdict.winner === 'draw' 
            ? 'Draw - Equal Responsibility' 
            : `Winner: Side ${verdict.winner.toUpperCase()}`}
        </p>
      </div>

      <div className="verdict-body">
        <p className="verdict-text">{verdict.verdict}</p>
        <p className="emotional-summary">{verdict.emotionalSummary}</p>
      </div>

      <div className="verdict-metrics">
        <Metric label="Toxicity" value={verdict.toxicityScore} />
        <Metric label="Communication" value={verdict.communicationScore} />
        <Metric label="Compatibility" value={verdict.emotionalCompatibility} />
        <Metric label="Survival" value={verdict.survivalChance} />
      </div>

      <div className="verdict-findings">
        <div className="findings-section">
          <h3>Red Flags Noted</h3>
          <ul>{verdict.redFlags.map(f => <li key={f}>{f}</li>)}</ul>
        </div>
        <div className="findings-section">
          <h3>Strengths Recognized</h3>
          <ul>{verdict.strengthsRecognized.map(s => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>

      <div className="verdict-observation">
        <p><em>{verdict.funniest}</em></p>
      </div>

      <div className="verdict-recommendation">
        <p><strong>Court Recommendation:</strong> {verdict.recommendation}</p>
      </div>

      <button className="btn-share">Share This Verdict</button>
    </motion.div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <label>{label}</label>
      <div className="metric-bar">
        <div className="metric-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="metric-value">{Math.round(value)}%</span>
    </div>
  )
}
```

---

## Summary

Choose your approach:

1. **Template-Based** - Fast, no AI, limited personalization
2. **Rule-Based** - Medium complexity, completely deterministic
3. **AI-Generated** - Best results, slight latency, most expensive

**Recommendation:** Start with templates, upgrade to AI when Gemini is integrated.
