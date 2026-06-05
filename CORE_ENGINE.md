# AI COURTROOM CORE ENGINE

## Architecture Overview

This document describes the **CORE ENGINE** for the AI Relationship Court application. The engine is designed as a single orchestration point that manages:

- **AI Orchestration** - Central decision-making system
- **Courtroom Memory** - Persistent state tracking
- **Conversation Flow** - Turn-taking and phase progression
- **Judge Control** - Dynamic courtroom progression

---

## System Design Philosophy

### Single Orchestrator Pattern

Unlike traditional AI chat systems with separate AI calls for judge, lawyer A, and lawyer B, this system uses **ONE central AI orchestrator** that:

1. Receives the complete courtroom state
2. Makes ALL decisions about what happens next
3. Returns structured JSON responses
4. Allows the frontend to handle UI/UX independently

**Benefits:**
- Consistent decision-making across all speakers
- True orchestration of conversational flow
- Memory-aware decision making
- Cinematic pacing control

---

## Core Modules

### 1. Courtroom Memory (`courtroomMemory.ts`)

**Purpose:** Persistent state that tracks everything the AI needs to know

**Key Data Structure:**
```typescript
interface CourtroomMemoryState {
  // Case setup
  caseSetup: CaseSetup
  
  // Session metadata
  sessionId: string
  currentPhase: CourtroomPhase
  round: number
  
  // Conversation history
  conversationHistory: Array<{
    id: string
    speaker: Speaker // judge | lawyerA | lawyerB | userA | userB
    message: string
    timestamp: number
    phase: CourtroomPhase
  }>
  
  // User statements (for detection & memory)
  userStatements: {
    A: Array<{ content, timestamp, emotionalTone, phaseMentioned }>
    B: Array<{ content, timestamp, emotionalTone, phaseMentioned }>
  }
  
  // Detected contradictions
  contradictions: Array<{
    statementA: string
    statementB: string
    insight: string
    severity: 'minor' | 'moderate' | 'severe'
  }>
  
  // Emotional tracking
  emotionalSignals: EmotionalSignal[]
  emotionalTrajectory: {
    A: Array<{ phase, tone }>
    B: Array<{ phase, tone }>
  }
  
  // Unresolved topics
  unresolvedQuestions: UnresolvedQuestion[]
  
  // Judgment context (for verdict)
  judgmentContext: {
    strongPointsA: string[]
    strongPointsB: string[]
    redFlagsA: string[]
    redFlagsB: string[]
    communicationPatterns: string[]
    emotionalHealthIndicators: string[]
  }
}
```

**Key Functions:**
- `initializeMemory(caseSetup)` - Create new memory
- `recordMessage(memory, speaker, message)` - Add to history
- `recordUserStatement(memory, speaker, statement)` - Track user input + detect contradictions
- `recordEmotionalSignal(memory, speaker, signal, intensity, evidence)` - Track emotional tone
- `recordUnresolvedQuestion(memory, askedBy, question)` - Track open questions
- `advancePhase(memory)` - Move to next phase
- `getMemorySummary(memory)` - Get context string for AI

---

### 2. Courtroom Orchestrator (`courtroomOrchestrator.ts`)

**Purpose:** Single AI decision point that orchestrates all courtroom actions

**Main Function:**
```typescript
async function orchestrateNextTurn(
  memory: CourtroomMemoryState,
  userInputIfAny?: { speaker: 'A' | 'B', content: string }
): Promise<OrchestratorResponse>
```

**Response Format (Structured JSON):**
```typescript
interface OrchestratorResponse {
  // Identity
  speaker: 'judge' | 'lawyerA' | 'lawyerB'
  message: string
  
  // Context
  phase: CourtroomPhase
  action: OrchestratorAction // 'next_speaker' | 'ask_clarification' | 'challenge_contradiction' | etc.
  
  // User interaction
  allowUserInput: boolean
  userInputType?: 'clarification' | 'response' | 'objection'
  userOptions?: {
    speak: string // "You Want To Say Something?"
    continue: string // "Lawyer Continues"
  }
  
  // Pacing
  messageDuration: number // ms for frontend timing
  hasTyping: boolean
  
  // Metadata
  mood?: CourtMood
  emotional: {
    intensity: number // 0-100
    tone: 'aggressive' | 'calm' | 'curious' | 'emotional' | 'analytical'
  }
  
  reasoning?: string // for debugging
}
```

**Decision Logic:**

The orchestrator determines the next action based on:

1. **Current Phase** - What should happen in this courtroom phase
2. **Contradictions** - Are there logical inconsistencies to challenge?
3. **Unresolved Questions** - Are there open questions that need answers?
4. **Emotional Signals** - What's the emotional temperature?
5. **User Participation** - Have users had enough voice?
6. **Round Number** - How many rounds of back-and-forth have occurred?

**Phase-Based Actions:**

```
OPENING_STATEMENTS
└─ If both lawyers present: move to next speaker
└─ If questions arise: ask clarification
└─ Eventually: advance phase

LAWYER_REFRAMING
└─ If contradictions exist: challenge them
└─ If unclear: ask clarification
└─ If rounds > 1: advance phase

CROSS_EXAMINATION
└─ If contradictions: challenge directly
└─ Ask follow-up questions
└─ Request emotional context

EMOTIONAL_CLARIFICATION
└─ Probe emotional impact
└─ Ask about deeper context
└─ Move to closing

FINAL_ARGUMENTS
└─ Let lawyers wrap up
└─ Request user final statements
└─ Prepare for verdict

VERDICT
└─ Deliver final ruling
└─ End case
```

---

### 3. Conversation Flow (`conversationFlow.ts`)

**Purpose:** Manages turn-taking logic and flow progression

**Key Responsibilities:**
- Track conversation turns
- Detect emotional tone in user input
- Calculate emotional intensity
- Determine when to advance phases
- Identify when user input is needed
- Validate flow consistency

**Key Functions:**
- `initializeConversationFlow()` - Create new flow state
- `addAIMessage(flow, response)` - Record AI turn
- `addUserInput(flow, memory, speaker, content)` - Record user input + emotional detection
- `shouldAdvancePhase(memory, flow)` - Check if phase should change
- `isUserInputNeeded(memory, flow)` - Determine if users should speak
- `getNextExpectedSpeaker(memory, flow)` - Who should speak next?

**Emotional Tone Detection:**
```
"but", "however", "actually"  → "defensive"
"always", "never", "!!"        → "aggressive"
"feel", "hurt", "sad", "love"  → "emotional"
"mean", "said", "understand"   → "clarifying"
```

---

### 4. API Endpoint (`/api/orchestrate`)

**Purpose:** Single HTTP endpoint that coordinates all orchestration

**Endpoint:** `POST /api/orchestrate`

**Request Body:**
```json
{
  "memory": CourtroomMemoryState,
  "userInput": {
    "speaker": "A" | "B",
    "content": "User text here"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": OrchestratorResponse,
  "updatedMemory": CourtroomMemoryState,
  "shouldAdvancePhase": boolean,
  "debug": {
    "userInputProcessed": boolean,
    "memoryUpdated": boolean,
    "timestamp": string
  }
}
```

**Request Flow:**
1. Frontend sends memory state + optional user input
2. API records user input in memory (if provided)
3. API detects emotional tone and intensity
4. API calls orchestrator to decide next action
5. API records AI response in memory
6. API returns updated memory + AI response

---

### 5. Zustand Store (`useCourtroomStore.ts`)

**Purpose:** Frontend state management for the courtroom session

**Key Store Properties:**
```typescript
{
  // Session
  caseSetup: CaseSetup
  memory: CourtroomMemoryState
  sessionId: string
  
  // UI State
  messages: CourtroomMessage[]
  isWaitingForUserInput: boolean
  currentPhase: string
  selectedUserOption: 'speak' | 'continue' | null
  
  // User Input
  userInput: { personA: string, personB: string }
  
  // Status
  isLoading: boolean
  error: string | null
}
```

**Key Actions:**
- `initializeSession(caseSetup)` - Start new case
- `submitUserInput(speaker, input)` - User submits statement
- `selectUserOption(option)` - User picks "Speak" or "Continue"
- `fetchNextTurn(userInput?)` - Calls `/api/orchestrate`
- `clearSession()` - Reset everything

---

## Courtroom Phases

```
1. OPENING_STATEMENTS
   └─ Both lawyers present initial arguments
   └─ Judge may ask for clarification
   └─ Users should introduce their positions

2. LAWYER_REFRAMING
   └─ Lawyers reinterpret user statements
   └─ Defend their client's position
   └─ Multiple rounds possible
   └─ Users can provide additional context

3. CROSS_EXAMINATION
   └─ Lawyers challenge contradictions
   └─ Point out inconsistencies
   └─ Demand explanations
   └─ Judge may intervene

4. EMOTIONAL_CLARIFICATION
   └─ Deep dive into emotional impact
   └─ Explore psychological harm
   └─ Reveal hidden layers
   └─ Users share emotional truth

5. FINAL_ARGUMENTS
   └─ Lawyers deliver closing statements
   └─ Summarize their case
   └─ Users have final say
   └─ Judge prepares verdict

6. VERDICT
   └─ Judge delivers final ruling
   └─ Explains decision reasoning
   └─ Case closes
```

---

## User Participation System

At key moments, users are presented with TWO OPTIONS:

### Option 1: "You Want To Say Something?"
- User can provide clarification
- Add emotional context
- Correct misunderstandings
- Introduce new evidence
- Share deeper thoughts

### Option 2: "Lawyer Continues"
- Lawyer continues automatically
- Uses previously recorded information
- Advances courtroom progression
- Keeps pace flowing

**When Users Are Prompted:**
- After contradictions are revealed
- When clarification is needed
- During emotional phase
- For final statements
- After multiple AI messages without user input

---

## Contradiction Detection System

The system automatically detects contradictions by:

1. **Extracting keywords** from statements
2. **Comparing with opponent statements** 
3. **Finding logical inconsistencies**
4. **Scoring severity** (minor/moderate/severe)
5. **Recording for future reference**

**Contradiction Insight Examples:**
- "You said you always called, but they said you never called"
- "Timeline doesn't match: you said this happened in March, but earlier you mentioned January"
- "You emphasized they were dismissive, but also said they tried hard"

---

## Emotional Tracking

The system tracks emotional signals across the case:

```typescript
interface EmotionalSignal {
  phase: CourtroomPhase
  speaker: 'A' | 'B'
  signal: string // 'defensive', 'aggressive', 'emotional', 'clarifying'
  intensity: number // 0-100
  evidence: string // text that triggered the signal
}
```

**Uses:**
- Detect when to move to emotional phase
- Measure emotional tension level
- Inform judge's responses
- Track emotional trajectory
- Build judgment context

---

## Judgment Context Collection

Throughout the case, the system collects data for final verdict:

```typescript
judgmentContext: {
  strongPointsA: string[]      // Arguments that hold up
  strongPointsB: string[]      // Counterarguments
  redFlagsA: string[]          // Problematic patterns
  redFlagsB: string[]          // Warning signs
  communicationPatterns: [],   // How they interact
  emotionalHealthIndicators: [] // Psychological state
}
```

This context can be used with AI to generate verdicts that feel:
- Informed by the actual case
- Emotionally resonant
- Nuanced and fair
- Personalized to the relationship

---

## Integration with Frontend

### For UI Components

**Example: Rendering an Orchestrator Response**

```tsx
function CourtroomMessage({ response }: { response: OrchestratorResponse }) {
  return (
    <div className={`message ${response.speaker}`}>
      {response.hasTyping && <TypingAnimation />}
      <div className="message-content">{response.message}</div>
      
      {response.allowUserInput && (
        <UserOptions options={response.userOptions} />
      )}
      
      <div className="emotion-indicator" style={{
        opacity: response.emotional.intensity / 100
      }}>
        {response.emotional.tone}
      </div>
    </div>
  )
}
```

### For Courtroom Page

```tsx
function CourtroomPage() {
  const { memory, messages, isWaitingForUserInput, fetchNextTurn } = useCourtroomStore()

  const handleUserInput = async (speaker: 'A' | 'B', content: string) => {
    await fetchNextTurn({ speaker, content })
  }

  const handleUserOption = async (option: 'speak' | 'continue') => {
    if (option === 'continue') {
      await fetchNextTurn()
    } else {
      // Show input UI
    }
  }

  return (
    <CourtroomLayout>
      {messages.map(msg => <CourtroomMessage key={msg.id} message={msg} />)}
      
      {isWaitingForUserInput && (
        <UserInputPrompt onSubmit={handleUserInput} />
      )}
    </CourtroomLayout>
  )
}
```

---

## Debugging & Monitoring

The system provides debugging utilities:

```typescript
// Get memory summary
const summary = store.getMemorySummary()

// Get all messages
const messages = store.getMessages()

// Validate flow consistency
const validation = validateFlowConsistency(memory, flow)
```

**Debug Output Example:**
```
Session: session-1717862400123
Phase: cross_examination
Round: 2
Messages: 8
User A statements: 2
User B statements: 2
Contradictions: 1
Emotional signals: 3
Unresolved questions: 2
```

---

## Next Steps for AI Integration

Currently, the orchestrator uses rule-based logic. To integrate with AI (Google Gemini):

1. **Build AI Prompt** - Pass memory summary + phase context to LLM
2. **Structure Response** - Parse LLM output into OrchestratorResponse
3. **Add Fallbacks** - Use rule-based responses if LLM unavailable
4. **Track Consistency** - Ensure AI decisions align with memory

**Example AI Prompt:**
```
You are orchestrating an AI relationship courtroom. Here's the current state:

[Memory Summary]

Current phase: ${phase}
Recent messages: ${recentMessages}
Contradictions: ${contradictions}
Emotional tone: ${emotionalTone}

Decide who speaks next and what they should say.
Respond in this JSON format:
{
  "speaker": "judge" | "lawyerA" | "lawyerB",
  "message": "...",
  "action": "...",
  "allowUserInput": boolean,
  "emotional": { "intensity": number, "tone": string }
}
```

---

## Performance Considerations

- **Memory State** - Stored client-side (can implement IndexedDB for persistence)
- **API Calls** - One call per turn (async/streaming optional later)
- **Emotional Detection** - Rule-based (regex), fast
- **Contradiction Detection** - O(n²) but n is small (< 20 statements typically)
- **Phase Advancement** - Deterministic rules, no AI latency

---

## Summary

The **CORE ENGINE** is built on these principles:

1. **Single Orchestrator** - One decision point for all AI actions
2. **Memory-Aware** - Every decision uses full courtroom context
3. **Structured Responses** - JSON format enables flexible UI/UX
4. **User-Centric** - Regular participation opportunities for both users
5. **Emotion-Aware** - Tracks emotional signals and intensity
6. **Phase-Based** - Clear progression through courtroom phases
7. **Scalable** - Ready for AI integration (currently rule-based)
8. **Debuggable** - Full state tracking and validation

This creates an **immersive, emotionally intelligent interactive courtroom simulation** that feels cinematic and believable—not like a chatbot.
