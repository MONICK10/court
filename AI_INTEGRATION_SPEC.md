# AI INTEGRATION SPECIFICATION

This document shows how to integrate Google Gemini Flash API for real AI courtroom orchestration.

---

## Current State

The orchestrator currently uses **rule-based logic** to decide what happens next. It makes good decisions but doesn't generate creative, contextual responses.

---

## AI Integration Points

The orchestrator needs AI for **ONE THING**: generating the next speaker's message based on context.

### Current Flow (Rule-Based)
```
Memory + Phase + Context 
  → Determine Speaker/Action (rule-based)
  → Generate Generic Message (template)
  → Return OrchestratorResponse
```

### With AI (Gemini)
```
Memory + Phase + Context
  → Determine Speaker/Action (rule-based) ✓ Keep this
  → Call Gemini to generate contextual message ← NEW
  → Return OrchestratorResponse
```

---

## Setup

### 1. Install Gemini SDK

```bash
npm install @google/generative-ai
```

### 2. Add API Key

Create `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

### 3. Create AI Service

Create `src/utils/geminiService.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateCourtMessage(
  speaker: 'judge' | 'lawyerA' | 'lawyerB',
  action: string,
  memorySummary: string,
  personality?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = buildPrompt(speaker, action, memorySummary, personality)

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Extract just the message (remove extra formatting if present)
  return text.trim()
}

function buildPrompt(
  speaker: 'judge' | 'lawyerA' | 'lawyerB',
  action: string,
  memorySummary: string,
  personality?: string
): string {
  const speakerDesc = {
    'judge': 'You are an authoritative AI judge orchestrating a relationship courtroom drama.',
    'lawyerA': 'You are Lawyer A - passionate, emotional, expressive, and dramatic. You defend your client emotionally and with conviction.',
    'lawyerB': 'You are Lawyer B - logical, calm, strategic, and measured. You defend your client with reason and perspective.',
  }

  return `
${speakerDesc[speaker]}

CURRENT COURTROOM STATE:
${memorySummary}

ACTION TO TAKE: ${action}

${personality ? `PERSONALITY NOTES: ${personality}` : ''}

Your task: Respond as this speaker with a courtroom message that:
1. Is concise (1-3 sentences for judges, 2-4 for lawyers)
2. Is dramatic and cinematic (not robotic)
3. Fits the current phase and context
4. Addresses the specific action required
5. Feels emotionally intelligent

Examples of good responses:
- "Your honor, I need to challenge something here. The timeline doesn't add up."
- "My client is telling me this hurt deeply. Not just factually, but emotionally."
- "The court requires clarification. Walk me through the sequence of events."

IMPORTANT: Generate ONLY the message itself. No meta-commentary, no explanations. Just the dialogue.

Respond with ONLY the courtroom message.
`.trim()
}
```

---

## Integration Points

### Update Orchestrator

Modify `src/utils/courtroomOrchestrator.ts`:

```typescript
import { generateCourtMessage } from './geminiService'

async function generateResponse(
  memory: CourtroomMemoryState,
  action: OrchestratorAction,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  const { mood, phase } = context

  try {
    // Determine speaker and get personality
    const speaker = determineNextSpeaker(memory, context)
    const personality = getSpeakerPersonality(speaker)
    
    // Get AI-generated message
    const message = await generateCourtMessage(
      speaker,
      action,
      context.memorySummary,
      personality
    )

    // Build response with AI message
    return buildOrchestratorResponse(
      speaker,
      message,
      action,
      memory,
      context
    )
  } catch (error) {
    console.error('AI generation failed, falling back to templates:', error)
    // Fall back to rule-based response
    return generateRuleBasedResponse(memory, action, context)
  }
}

function getSpeakerPersonality(speaker: 'judge' | 'lawyerA' | 'lawyerB'): string {
  const personalities = {
    'judge': 'Authoritative, observant, controls pace, asks incisive questions.',
    'lawyerA': 'Passionate and dramatic. Uses emotional language. Advocates fiercely.',
    'lawyerB': 'Logical and measured. Uses reasoning. Offers alternative perspectives.',
  }
  return personalities[speaker]
}
```

---

## API Endpoint Update

Update `src/app/api/orchestrate/route.ts`:

```typescript
import { generateCourtMessage } from '@/utils/geminiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memory, userInput } = body

    // ... process user input ...

    // Get AI response
    const orchestratorResponse = await orchestrateNextTurn(memory)
    
    // response.message is now AI-generated if Gemini is available
    // Falls back to templates if not

    // ... rest of logic ...
  } catch (error) {
    // Error handling
  }
}
```

---

## Advanced: Multi-Step AI Orchestration

For more sophisticated orchestration, have AI make ALL decisions:

```typescript
async function orchestrateWithFullAI(
  memory: CourtroomMemoryState
): Promise<OrchestratorResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
You are orchestrating an AI courtroom drama. You must decide:
1. Who speaks next (judge, lawyerA, lawyerB)
2. What action to take
3. What the speaker says

Return ONLY valid JSON in this format:
{
  "speaker": "judge" | "lawyerA" | "lawyerB",
  "message": "The courtroom message",
  "action": "next_speaker" | "ask_clarification" | "challenge_contradiction" | "reveal_emotional_layer" | "request_user_input" | "advance_phase" | "deliver_verdict",
  "emotional": {
    "intensity": 0-100,
    "tone": "aggressive" | "calm" | "curious" | "emotional" | "analytical"
  }
}

COURTROOM STATE:
${getMemorySummary(memory)}

Make a decision that:
- Progresses the case naturally
- Reveals contradictions when present
- Deepens emotional exploration
- Respects user participation
- Feels cinematic and immersive
  `

  const result = await model.generateContent(prompt)
  const response = JSON.parse(result.response.text())

  return {
    speaker: response.speaker,
    message: response.message,
    phase: memory.currentPhase,
    action: response.action,
    allowUserInput: shouldAllowUserInput(memory, response.action),
    userOptions: {
      speak: 'You Want To Say Something?',
      continue: 'Lawyer Continues',
    },
    messageDuration: calculateDuration(response.message),
    hasTyping: true,
    mood: memory.caseSetup.mood,
    emotional: response.emotional,
  }
}
```

---

## Caching for Performance

Since Gemini API calls have latency, consider caching similar contexts:

```typescript
import NodeCache from 'node-cache'

const messageCache = new NodeCache({ stdTTL: 600 }) // 10 min cache

async function generateCourtMessageWithCache(
  speaker: 'judge' | 'lawyerA' | 'lawyerB',
  action: string,
  memorySummary: string
): Promise<string> {
  // Create cache key from inputs
  const cacheKey = `${speaker}:${action}:${memorySummary.substring(0, 50)}`

  // Check cache
  const cached = messageCache.get(cacheKey)
  if (cached) {
    return cached as string
  }

  // Generate if not cached
  const message = await generateCourtMessage(speaker, action, memorySummary)

  // Store in cache
  messageCache.set(cacheKey, message)

  return message
}
```

---

## Error Handling & Fallbacks

```typescript
async function generateResponseSafely(
  memory: CourtroomMemoryState,
  action: OrchestratorAction,
  context: OrchestratorContext
): Promise<OrchestratorResponse> {
  try {
    // Try AI
    return await generateResponse(memory, action, context)
  } catch (aiError) {
    console.warn('AI orchestration failed:', aiError)

    try {
      // Fall back to rule-based
      return generateRuleBasedResponse(memory, action, context)
    } catch (fallbackError) {
      console.error('All orchestration failed:', fallbackError)

      // Last resort: simple response
      return {
        speaker: 'judge',
        message: 'The court continues...',
        phase: memory.currentPhase,
        action: 'next_speaker',
        allowUserInput: true,
        userOptions: {
          speak: 'You Want To Say Something?',
          continue: 'Lawyer Continues',
        },
        messageDuration: 2000,
        hasTyping: false,
        mood: context.mood,
        emotional: {
          intensity: 50,
          tone: 'calm',
        },
      }
    }
  }
}
```

---

## Testing AI Integration

### 1. Test with Mock Memory

```typescript
import { generateCourtMessage } from '@/utils/geminiService'

// In a test file
async function testAIGeneration() {
  const message = await generateCourtMessage(
    'judge',
    'ask_clarification',
    'Session has 5 messages, user A said "you ignore me", user B said "I try my best"'
  )
  console.log('Generated:', message)
}
```

### 2. Test Error Handling

```typescript
// Disconnect API key to test fallback
process.env.GEMINI_API_KEY = 'invalid'

const response = await orchestrateNextTurn(memory)
console.log('Should use template:', response.message)
```

### 3. Test Latency

```typescript
console.time('orchestration')
const response = await orchestrateNextTurn(memory)
console.timeEnd('orchestration')
// Should be < 2 seconds
```

---

## Cost Optimization

Gemini 1.5 Flash is cheap:
- ~$0.075 per million input tokens
- ~$0.30 per million output tokens

A typical courtroom case (10-20 turns):
- ~500 tokens per turn average
- ~$0.01-0.02 per full case

**To optimize costs:**
1. Use Flash model (not Pro)
2. Cache repeated contexts
3. Batch non-urgent requests
4. Set token limits in prompts

---

## Streaming (Optional)

For real-time typing animations:

```typescript
async function* generateCourtMessageStreaming(
  speaker: 'judge' | 'lawyerA' | 'lawyerB',
  action: string,
  memorySummary: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { maxOutputTokens: 200 } })
  
  const prompt = buildPrompt(speaker, action, memorySummary)
  
  const stream = await model.generateContentStream(prompt)
  
  for await (const chunk of stream.stream) {
    yield chunk.text()
  }
}

// Use in frontend for typing animation
const messageStream = generateCourtMessageStreaming('judge', 'ask_clarification', summary)
for await (const chunk of messageStream) {
  updateMessageText(prevText + chunk)
}
```

---

## Production Checklist

- [ ] API key in environment variables
- [ ] Error handling for API failures
- [ ] Fallback to rule-based responses
- [ ] Response caching implemented
- [ ] Token limits set (max 200 tokens per message)
- [ ] Latency monitoring
- [ ] Cost tracking
- [ ] Rate limiting if needed
- [ ] Streaming setup (if using typing animation)
- [ ] Tests for common failure modes

---

## Example: Full AI Integration

```typescript
// src/utils/courtroomOrchestrator.ts
import { generateCourtMessage } from './geminiService'

export async function orchestrateNextTurn(
  memory: CourtroomMemoryState,
  userInputIfAny?: { speaker: 'A' | 'B'; content: string }
): Promise<OrchestratorResponse> {
  const context = buildOrchestratorContext(memory)
  const action = determineNextAction(memory, context)

  // NEW: Generate with AI
  const speaker = determineNextSpeaker(memory, context)
  const personality = getSpeakerPersonality(speaker)
  const message = await generateCourtMessage(
    speaker,
    action,
    context.memorySummary,
    personality
  )

  return {
    speaker,
    message, // AI-generated!
    phase: context.phase,
    action,
    allowUserInput: true,
    userOptions: {
      speak: 'You Want To Say Something?',
      continue: 'Lawyer Continues',
    },
    messageDuration: calculateDuration(message),
    hasTyping: true,
    mood: context.mood,
    emotional: {
      intensity: calculateIntensity(message, action),
      tone: getSpeakerTone(speaker),
    },
  }
}
```

---

## Next: Verdict Generation

For the final verdict, use AI with judgment context:

```typescript
async function generateVerdict(
  memory: CourtroomMemoryState
): Promise<string> {
  return await generateCourtMessage(
    'judge',
    'deliver_verdict',
    getVerdictPrompt(memory) // Includes judgment context
  )
}
```

See `CORE_ENGINE.md` for `judgmentContext` structure.
