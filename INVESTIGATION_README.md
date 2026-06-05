# AI Relationship Court - Investigation System 🔍⚖️

## THE TRANSFORMATION

This app has been completely restructured from a **generic roleplay courtroom** to an **intelligent AI-driven investigation system**.

**The judge is no longer a passive narrator. The judge is the investigator.**

---

## WHAT CHANGED

### Before (Removed)
- Generic roleplay dialogue
- Fixed phase progression
- "Lawyer Continues" filler button
- Passive judge narration
- Generic templates
- Time-based courtroom
- Random conversations

### After (New)
- Intelligent investigation
- Dynamic judge-controlled pacing
- Contextual, targeted questioning
- Active judge orchestration
- Case-anchored responses
- Investigation-based progression
- Focused dialogue on actual conflict

---

## CORE EXPERIENCE

```
User submits case with two conflicting statements
  ↓
Judge analyzes statements, detects contradictions
  ↓
Judge asks TARGETED questions based on contradictions
  ↓
User responds when judge requests
  ↓
Judge explores emotional layers
  ↓
When judge confidence >= 75%, verdict is delivered
  ↓
All responses referenced actual case details
```

**The user feels: "The judge actually understands my situation."**

---

## KEY SYSTEMS

### 1. **Case Anchor** (`src/utils/caseAnchor.ts`)

Every response stays anchored to the actual conflict.

```typescript
CaseAnchor {
  coreConflict: "The central dispute"
  contradictions: [...],         // Logical inconsistencies
  unresolvedQuestions: [...],    // What needs answering
  timelineIssues: [...],         // When did things happen?
  emotionalConcerns: [...],      // How do people feel?
  establishedFacts: [...],       // What's confirmed true?
}
```

**Purpose**: Prevents conversation drift. Every Gemini prompt includes case context.

### 2. **Judge Confidence** (`src/utils/judgeConfidence.ts`)

Tracks the judge's internal understanding (0-100%).

```typescript
JudgeConfidence {
  overall: 75,                    // Overall confidence
  clarityLevel: 78,               // How clear is the truth?
  emotionalUnderstanding: 72,     // Does judge understand core?
  contradictionsRemaining: 1,     // Still investigating?
  readyForVerdict: true           // Enough for verdict?
}
```

**Purpose**: Determines when investigation is complete. Dynamic pacing.

### 3. **Targeted Questioning** (`src/utils/targetedQuestions.ts`)

Generates intelligent questions, never generic filler.

**GOOD questions:**
- "You said X, but the evidence shows Y. How do you explain this?"
- "When exactly did this happen?"
- "What were you feeling at that moment?"

**BAD questions (REJECTED):**
- "The situation is more nuanced..."
- "Let me provide context..."
- "The defense may clarify..."

### 4. **Judge Orchestrator** (`src/utils/newJudgeOrchestrator.ts`)

The intelligent core. Judge decides what happens next.

```
1. Judge assesses court state
2. Judge calculates confidence
3. Judge checks: Is verdict ready?
4. If NO: What needs investigation?
   - Severe contradictions?
   - Unanswered questions?
   - Emotional understanding incomplete?
   - Timeline inconsistencies?
5. Judge takes appropriate action
```

### 5. **Investigation Store** (`src/hooks/useInvestigationStore.ts`)

Frontend state management for investigation flow.

```typescript
useInvestigationStore {
  caseSetup: CaseSetup
  courtState: CourtState          // Current investigation
  messages: InvestigationMessage[]
  isWaitingForUserInput: boolean  // Judge awaits response?
  nextTarget: 'userA' | 'userB'   // Who should speak?
}
```

---

## USER FLOW

### 1. Setup Page
User enters:
- Case title
- Their name & argument
- Other person's name & argument
- Mood (serious/funny/drama/savage)

### 2. Courtroom Initialization
```
Judge: "This court is now in session. The matter before us: [Title].
I have reviewed both statements. There are contradictions requiring
investigation. Let us begin."
```

Judge has already detected contradictions using Gemini analysis.

### 3. Investigation Phase

Judge asks targeted questions based on priorities:

**Priority 1: Severe Contradictions**
Judge: "You said X, but evidence shows Y. How do you reconcile this?"

**Priority 2: Timeline Issues**
Judge: "You claim this happened at T, yet you were documented elsewhere."

**Priority 3: Emotional Understanding**
Judge: "I sense [emotion] in your account. When did you first feel this?"

### 4. User Response
Judge: "User A, how do you respond?"
User submits statement.

### 5. Investigation Continues
Judge confidence increases as contradictions are addressed, facts established.

### 6. Verdict (When Confidence >= 75%)
Judge: "After thorough investigation, I find: [Verdict based on analysis]"

---

## NO FIXED TIME LIMITS

The investigation lasts as long as needed:
- **Simple cases**: 3-4 turns (clear contradiction)
- **Complex cases**: 6-8 turns (emotional depth needed)
- **Verdict threshold**: Judge confidence >= 75%, <= 1 unresolved issue

There is NO:
- Fixed 5-minute session
- Fixed round count
- Time limits
- Arbitrary phase progression

---

## JUDGE CONFIDENCE DISPLAY

Users see judge confidence percentage and progress:

```
Judge Confidence: 45%
▄▄▄▄▄░░░░░░░░░░░░░░░░░░░░░░

"1/3 contradictions resolved. More evidence needed."
```

This transparency shows:
- Investigation is making progress
- Judge is taking case seriously
- Verdict is based on actual clarity

---

## WHAT YOU NEVER SEE

❌ Generic "Lawyer Continues" button
❌ Filler responses like "Interesting point..."
❌ Passive judge narration
❌ Conversations drifting from core issue
❌ Arbitrary phase transitions
❌ Time-based conclusions
❌ Random AI dialogue

---

## API ENDPOINT

### `POST /api/orchestrate`

**Initialize:**
```json
{
  "caseSetup": {...},
  "isInitialization": true
}
```

**Continue:**
```json
{
  "state": {...CourtState...},
  "userInput": {
    "speaker": "userA",
    "content": "Here is my response..."
  }
}
```

**Response:**
```json
{
  "judgeResponse": {
    "speaker": "judge",
    "message": "...",
    "messageType": "question|statement|challenge|verdict",
    "requiresUserResponse": true,
    "intensity": 70,
    "tone": "investigative"
  },
  "updatedState": {...},
  "readyForVerdict": false
}
```

---

## TESTING

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for:
- Example test cases
- What to monitor
- Debugging tips
- Performance metrics
- Success criteria

Quick test:
```bash
# 1. Visit http://localhost:3000
# 2. Go to Setup page
# 3. Enter conflicting statements
# 4. Watch judge investigate
# 5. Verify no generic filler
```

---

## TECHNICAL ARCHITECTURE

### New Files (Investigation System)
```
src/utils/
  ├── caseAnchor.ts              # Case anchoring
  ├── judgeConfidence.ts         # Confidence tracking
  ├── targetedQuestions.ts       # Question generation
  ├── newJudgeOrchestrator.ts    # Judge decisions
  └── investigativeGeminiService.ts # AI orchestration

src/hooks/
  └── useInvestigationStore.ts   # Frontend store

src/app/
  └── courtroom/page.tsx         # Rewritten for investigation
```

### Updated Files
```
src/app/api/orchestrate/route.ts      # Investigation endpoint
src/components/UserInputPanel.tsx      # Simplified UI
```

### Legacy Files (Kept for reference)
```
src/utils/courtroomMemory.ts           # Old memory system
src/utils/courtroomOrchestrator.ts     # Old orchestrator
src/utils/geminiService.ts             # Old Gemini prompting
src/hooks/useCourtroomStore.ts         # Old store
```

---

## VERDICT CONDITIONS

Judge delivers verdict ONLY when:

✅ Judge confidence >= 75%
✅ Contradictions remaining <= 1
✅ Unresolved questions <= 1
✅ Emotional understanding >= 70%
✅ Investigation phase = 'emotional_clarification'

Until ALL conditions are met, investigation continues.

---

## EXAMPLE INTERACTION

**Setup:**
- Title: "Did you cheat?"
- Person A: "I saw you texting your ex at 11 PM"
- Person B: "I was working. I never texted anyone."

**Turn 1 - Judge Opens:**
```
Judge: "This court is now in session. I've detected a critical
contradiction. Person B, if you were working, how do you explain
the phone activity records? Let me start with Person A..."
```

**Turn 2 - Judge Asks:**
```
Judge: "Person A, describe what you saw. Exactly what messages?"
[User responds with details]
```

**Turn 3 - Judge Challenges:**
```
Judge: "Person B, the evidence contradicts your account.
Can you explain the phone logs?"
[User responds]
```

**Turn 4 - Judge Explores:**
```
Judge: "Beneath this dispute, I sense trust issues. Person A,
when did you first doubt their honesty?"
[User explores emotional root]
```

**Turn 5 - Judge Decides:**
```
Judge: "I have sufficient clarity. The contradiction has been
resolved. The deeper issue is broken trust. My finding: ..."
```

---

## SUCCESS METRICS

The system is working when:

✅ Judge asks 4-6 contextual questions per case
✅ Every question references case details
✅ Contradictions are detected and challenged
✅ Judge confidence grows steadily
✅ No generic courtroom filler appears
✅ User feels: "The judge actually understands"

---

## DEVELOPMENT GUIDELINES

### When Adding Features:

1. **Keep case anchor updated** - Every response must reference it
2. **Increase judge confidence** - Show progress with each turn
3. **Ask targeted questions** - No filler, only investigation
4. **Let judge control flow** - Don't automate participation
5. **Make verdicts smart** - Base on actual investigation

### When Writing Gemini Prompts:

```javascript
// ❌ WRONG
"Continue the courtroom conversation"

// ✅ RIGHT
"Analyze the investigation state. What is the most important
unresolved issue? Should the judge ask about contradictions,
timeline, or emotional context?"
```

---

## IMPORTANT NOTES

### The Judge Doesn't Roleplay
The judge is an analytical AI making investigation decisions.

### Users Don't Interrupt
The judge controls who speaks and when. Users respond when requested.

### Investigation Depth Adapts
Simple cases resolve quickly. Complex cases require deeper exploration.

### Every Response Matters
Every message advances investigation or explores emotional truth.

### No Time Limits
Investigation continues until 75% clarity, not based on timers.

---

## TROUBLESHOOTING

### Judge asks generic questions?
→ Check `targetedQuestions.ts` for anchoring validation

### Verdict appears too early?
→ Check `judgeConfidence.ts` for threshold verification

### User input isn't requested?
→ Verify `nextTarget` is set in `judgeResponse`

### Contradictions not detected?
→ Check Gemini API response in `investigativeGeminiService.ts`

---

## NEXT PHASE

Planned improvements:
- [ ] Investigation timeline visualization
- [ ] Confidence progress graph
- [ ] Contradiction resolution tracker
- [ ] Emotional arc display
- [ ] Shareable verdict cards
- [ ] Case analytics dashboard

---

## PHILOSOPHY

This system is built on one principle:

**"The judge actually understands the situation."**

Not because of clever roleplay.
Not because of cinematic dialogue.

But because:
- The judge anchors to facts
- The judge detects contradictions
- The judge asks smart questions
- The judge explores emotional truth
- The judge decides when enough is known

The user doesn't feel like they're playing a game.
**The user feels heard, understood, investigated.**

---

## LAUNCH

App is live at `http://localhost:3000`

Test with contradictory case scenarios and verify:
1. Judge detects contradictions
2. Judge asks targeted questions
3. Judge confidence increases
4. Investigation continues until 75% clarity
5. Verdict is informed and fair

---

**Investigation System Active. Ready for Testing.**
