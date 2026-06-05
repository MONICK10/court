# AI Relationship Court - Investigation System Architecture

## TRANSFORMATION COMPLETE

The application has been fundamentally restructured from a **generic roleplay courtroom** to an **intelligent AI-driven investigation system** where the judge is the core orchestrator.

---

## CORE PRINCIPLE

**"The judge actually understands the situation."**

The application is no longer roleplay. It's an AI investigation system that:
- Anchors all responses to the actual conflict
- Prevents conversation drift
- Eliminates generic filler dialogue
- Dynamically determines investigation depth
- Investigates contradictions intelligently
- Discovers emotional truth

---

## NEW ARCHITECTURE

### 1. **CaseAnchor System** (`src/utils/caseAnchor.ts`)

The **foundation** of the investigation. Every response stays anchored to this.

```typescript
CaseAnchor {
  coreConflict: string                    // The actual dispute
  personAPosition: string                 // What Person A claims
  personBPosition: string                 // What Person B claims
  
  contradictions: Contradiction[]         // Logical inconsistencies detected
  unresolvedQuestions: UnresolvedQuestion[] // Questions needing answers
  timelineIssues: TimelineIssue[]        // Timeline inconsistencies
  emotionalConcerns: EmotionalConcern[]  // Emotional layers
  emotionalIntensity: number             // 0-100
  primaryEmotion: string                 // hurt, anger, betrayal, etc.
  
  establishedFacts: string[]             // Facts confirmed as true
}
```

**Purpose:**
- Prevents AI responses from becoming generic filler
- Tracks investigation progress
- Guides judge decision-making
- Ensures every message references actual case details

**Key Functions:**
- `initializeCaseAnchor()` - Creates anchor from case setup
- `detectContradictions()` - Finds logical inconsistencies
- `identifyUnresolvedQuestions()` - Extracts unclear details
- `getCaseAnchorContext()` - Generates AI prompt context

---

### 2. **JudgeConfidence System** (`src/utils/judgeConfidence.ts`)

Tracks the judge's internal understanding. Determines when verdict is ready.

```typescript
JudgeConfidence {
  overall: number                    // 0-100
  clarityLevel: number              // How clear is the truth?
  emotionalUnderstanding: number    // Does judge understand core?
  contradictionsResolved: number    // Count resolved
  contradictionsRemaining: number   // Count unresolved
  factsEstablished: number          // Count of facts
  
  readyForVerdict: boolean          // Can we deliver verdict?
  verdictThreshold: number          // Usually 75%
  
  reasoning: string[]               // Why judge is/isn't ready
  confidenceHistory: ConfidenceRecord[]
}
```

**Purpose:**
- Dynamically controls pacing (no fixed round limits)
- Determines when investigation is complete
- Prevents premature verdicts
- Tracks investigation progress transparently

**Key Functions:**
- `calculateJudgeConfidence()` - Updates confidence based on progress
- `determineNextInvestigationPriority()` - Decides what to investigate next
- `getConfidenceAssessment()` - Human-readable status

---

### 3. **Targeted Questioning Engine** (`src/utils/targetedQuestions.ts`)

Generates intelligent, contextual questions. NOT generic filler.

**Question Types:**
- **Contradiction Challenge**: "You said X but evidence shows Y. How?"
- **Timeline Probe**: "You claim this happened at T, but you were elsewhere."
- **Emotional Deep Dive**: "When did you first feel this? Tell me about that moment."
- **Evidence Challenge**: "This fact contradicts your statement."
- **Follow-Up**: Seek deeper truth on unresolved claims

**NEVER generates:**
- "The situation is more nuanced..."
- "Let me provide context..."
- "The defense may clarify..."
- Any generic courtroom filler

**Key Functions:**
- `generateBestNextQuestion()` - Picks most important question
- `isGenericFiller()` - Rejects filler dialogue
- `isAnchored()` - Verifies question references case details

---

### 4. **Judge Orchestrator** (`src/utils/newJudgeOrchestrator.ts`)

**The core decision engine.** The judge analyzes state and decides what happens next.

```typescript
CourtState {
  caseSetup: CaseSetup
  caseAnchor: CaseAnchor              // Investigation foundation
  judgeConfidence: JudgeConfidence    // Judge's certainty level
  
  messages: Message[]                 // Conversation history
  userParticipation: {
    personA: { count, statements }
    personB: { count, statements }
  }
  
  investigationPhase: string          // Current phase
  turnCount: number                   // Total turns elapsed
}
```

**Decision Flow:**
1. Assess investigation state
2. Calculate judge confidence
3. Check if verdict is ready
4. If not, determine next investigation step
5. Generate appropriate response

**Response Types:**
- Challenge contradictions
- Ask clarifying questions
- Explore emotional core
- Probe timeline inconsistencies
- Deliver verdict

---

### 5. **Investigation-Focused Gemini Service** (`src/utils/investigativeGeminiService.ts`)

**AI is the investigation orchestrator**, not a dialogue generator.

**Key Prompts:**
- `analyzeCourtStateAndDecide()` - What should judge do next?
- `generateTargetedJudgeQuestion()` - Generate specific investigation question
- `generateLawyerResponse()` - Lawyer defends actual claims (not filler)
- `analyzeForContradictions()` - Find logical inconsistencies
- `analyzeEmotionalContext()` - Detect primary emotion

**Critical Principle:**
Every AI prompt includes **CaseAnchorContext** to prevent drift.

---

### 6. **Investigation Store** (`src/hooks/useInvestigationStore.ts`)

Zustand store for frontend state management.

**Replaces:** Old `useCourtroomStore`

**Key Actions:**
- `initializeSession()` - Creates new investigation
- `submitUserInput()` - Records user statement
- `fetchNextTurn()` - Gets judge's next action
- `addMessage()` - Adds to UI message history

---

### 7. **Updated Courtroom Page** (`src/app/courtroom/page.tsx`)

Completely rewritten for investigation flow.

**Features:**
- Judge Confidence display (visual progress)
- Investigation-focused message rendering
- Dynamic user input prompt (judge controls who speaks)
- Verdict phase with investigation summary
- No more generic "Lawyer Continues" button

---

## FLOW COMPARISON

### OLD SYSTEM (REMOVED)
```
User Input
  ↓
Generic Phase Logic (opening → lawyer reframing → cross exam → verdict)
  ↓
Random AI dialogue generation
  ↓
Fixed round/time limits
  ↓
Generic verdict
```

### NEW SYSTEM (INVESTIGATION-DRIVEN)
```
User Input
  ↓
Judge analyzes court state against CaseAnchor
  ↓
Calculate judge confidence
  ↓
Check: Is verdict ready?
  ↓
If NO: Determine investigation priority
  - Severe contradictions?
  - Unanswered questions?
  - Emotional understanding lacking?
  - Timeline inconsistencies?
  ↓
Generate targeted, contextual response
  ↓
Update CaseAnchor & confidence
  ↓
Repeat until verdict conditions met
```

---

## KEY CHANGES

### 1. **Removed Generic Continuation System**
- **GONE:** "Lawyer Continues" button that generates filler
- **GONE:** Automated phase progression (opening → reframing → cross exam)
- **GONE:** Fixed round limits
- **GONE:** Generic dialogue templates

### 2. **Judge Now Controls Flow**
- Judge decides who speaks next
- Judge decides when more investigation needed
- Judge decides when verdict is ready
- NO automation of participation

### 3. **Every Response Must Be Anchored**
- References actual case details
- Addresses unresolved questions
- Challenges real contradictions
- Explores true emotional concerns

### 4. **Investigation-Based Pacing**
- No fixed time limits
- Investigation continues until clarity threshold met
- Some cases end quickly (clear contradictions)
- Some require deeper emotional exploration
- Verdict only when confidence >= 75%

### 5. **Transparency**
- Judge Confidence displayed to user
- Users see what judge is investigating
- Users see progress toward verdict
- No hidden decision logic

---

## USER EXPERIENCE IMPROVEMENTS

### What the user experiences:

1. **Opening**: Judge analyzes both statements, detects contradictions
2. **Investigation**: Judge asks targeted questions based on contradictions
3. **Questioning**: Users respond only when judge requests
4. **Emotional Depth**: Judge explores emotional core once facts clear
5. **Verdict**: Judge delivers informed verdict with specific reasoning

### What the user DOESN'T experience:

- ❌ Random "Lawyer Continues" filler
- ❌ Generic courtroom speeches
- ❌ Conversations drifting from core issue
- ❌ Fixed round limits
- ❌ Arbitrary phase progression
- ❌ Passively observing roleplay

---

## TECHNICAL IMPROVEMENTS

### Type Safety
- New `CourtState` replaces vague `CourtroomMemoryState`
- `CaseAnchor` provides structure for investigation
- `JudgeConfidence` clearly tracks state progression
- `JudgeResponse` defines all judge actions

### Decision Clarity
- Every judge action has a reason
- Investigation progress is quantifiable
- Verdict conditions are explicit (75% confidence, <= 1 unresolved)
- No magic numbers or hidden logic

### AI Reliability
- Gemini prompts are investigation-focused, not dialogue-focused
- Every prompt includes case context
- Structured JSON responses (not free-form text)
- Contradiction detection is semantic, not pattern-based

### Scalability
- New system can handle complex disputes
- Investigation depth adapts to case
- Emotional analysis complements fact investigation
- Multi-turn conversations stay anchored

---

## GEMINI PROMPTING STRATEGY

### OLD APPROACH (REMOVED)
```javascript
"You are a witty judge. Continue the courtroom conversation."
```

### NEW APPROACH
```javascript
"Analyze current investigation state and determine:
- Are unresolved contradictions?
- Are unanswered questions?
- Is emotional understanding incomplete?
- Which is the priority?
- Is verdict ready?

ONLY IF ready: deliver verdict
ELSE: ask the most important next question"
```

---

## VERDICT CONDITIONS

Judge delivers verdict ONLY when:

1. `judgeConfidence.overall >= 75%`
2. `contradictionsRemaining <= 1`
3. `unresolvedQuestions <= 1`
4. `emotionalUnderstanding >= 70%`
5. `investigationPhase === 'emotional_clarification'`

Until these are met, investigation continues.

---

## FILE STRUCTURE

New investigation files:
```
src/utils/
  ├── caseAnchor.ts                    // Case anchoring system
  ├── judgeConfidence.ts               // Confidence tracking
  ├── targetedQuestions.ts             // Question generation
  ├── newJudgeOrchestrator.ts          // Core orchestration
  └── investigativeGeminiService.ts    // AI orchestrator

src/hooks/
  └── useInvestigationStore.ts         // Investigation store

src/app/
  └── courtroom/page.tsx               // Updated page

src/app/api/
  └── orchestrate/route.ts             // Updated API
```

Old files (unchanged but available):
- `courtroomMemory.ts` (legacy)
- `courtroomOrchestrator.ts` (legacy)
- `geminiService.ts` (legacy)
- `useCourtroomStore.ts` (legacy)

---

## NEXT STEPS

1. **Test Investigation Flow**: Submit cases and verify judge asks targeted questions
2. **Monitor Contradiction Detection**: Ensure Gemini identifies real inconsistencies
3. **Verify Verdict Conditions**: Ensure verdict only appears when ready
4. **Refine Questioning**: Adjust question intensity and tone as needed
5. **UI Polish**: Add investigation timeline, confidence visualization

---

## CRITICAL SUCCESS METRICS

✅ **No generic filler dialogue**
✅ **Every response anchored to case**
✅ **Judge confidence visible to user**
✅ **Investigation depth adapts to case**
✅ **Contradictions detected and addressed**
✅ **Emotional truth explored**
✅ **Verdict only when ready**
✅ **User feels: "The judge understands my situation"**

---

## SYSTEM QUOTE

> "The judge doesn't follow a script. The judge analyzes the case, investigates contradictions, explores emotional concerns, and decides when enough clarity exists for verdict. The user doesn't interrupt — the judge controls who speaks."

---

**Architecture transformation complete. The app is now an investigation system, not a roleplay engine.**
