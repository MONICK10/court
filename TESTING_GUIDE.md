# TESTING THE INVESTIGATION SYSTEM

## Quick Start

1. Navigate to setup page
2. Enter a case with contradictory statements
3. Watch the judge investigate

## Example Test Cases

### Test Case 1: Clear Contradiction

**Title**: "Did You Cheat?"

**Person A Statement**: 
"I saw you texting your ex at 11 PM last night. You said you were busy working."

**Person B Statement**:
"I was absolutely busy working. I never texted my ex. That's ridiculous."

**Expected Flow**:
1. Judge identifies contradiction: "texting at 11 PM" vs "not texting"
2. Judge asks Person B: "If you were working, why does the phone log show activity?"
3. Contradiction resolved → confidence increases → emotional exploration
4. Judge asks about feelings → Person B explains stress
5. Verdict delivered when clarity >= 75%

### Test Case 2: Timeline Inconsistency

**Title**: "Did You Skip Our Anniversary?"

**Person A Statement**:
"You said you had to work late on our anniversary. But I saw you at Jake's bar at 8 PM."

**Person B Statement**:
"Work ran late. I stopped by the bar afterwards for 30 minutes to decompress."

**Expected Flow**:
1. Judge detects timeline contradiction
2. Judge challenges: "When exactly did work end?"
3. Person B provides answer
4. Judge explores emotional layer: "How important was this anniversary?"
5. Verdict when emotional truth understood

### Test Case 3: Competing Narratives

**Title**: "Who Ghosted Whom?"

**Person A Statement**:
"I was waiting for them to reach out. They ignored me for two weeks."

**Person B Statement**:
"They were the one being distant. I didn't want to seem desperate."

**Expected Flow**:
1. Both have "unanswered questions": Why did each stop communicating?
2. Judge asks Person A: "When exactly did communication stop?"
3. Judge asks Person B: "Why did you feel desperate?"
4. Emotional layer emerges: fear of rejection on both sides
5. Verdict: mutual miscommunication + fear

---

## What to Monitor

### ✅ Good Signs (Judge Is Investigating)

- [ ] Judge asks specific questions referencing case details
- [ ] Questions challenge contradictions
- [ ] Judge confidence percentage increases
- [ ] Judge asks follow-up questions on unclear points
- [ ] Judge explores emotional context after facts clear
- [ ] Messages are concise (1-3 sentences)
- [ ] No generic courtroom filler

### ❌ Red Flags (System Not Working)

- [ ] Generic responses like "Interesting point..."
- [ ] Judge doesn't ask follow-up questions
- [ ] Confidence stays at 0% or 100%
- [ ] User interrupted repeatedly
- [ ] Verdict delivered immediately
- [ ] Messages are long paragraphs
- [ ] No evidence of contradiction detection

---

## Debugging

### If judge doesn't detect contradictions:

Check `investigativeGeminiService.ts`:
- Ensure `analyzeForContradictions()` is being called
- Verify Gemini API is returning JSON
- Add console.log in `judgeOrchestrator.ts` to see `caseAnchor.contradictions`

### If questions aren't targeted:

Check `targetedQuestions.ts`:
- Verify `generateBestNextQuestion()` logic
- Check if case anchor has unresolved questions
- Ensure Gemini prompts include case context

### If verdict appears too early:

Check `judgeConfidence.ts`:
- Verify `overall >= 75` check
- Verify `contradictionsRemaining <= 1` check
- Monitor confidence calculation

### If user can't submit input:

Check `useInvestigationStore.ts`:
- Verify `nextTarget` is set by judge response
- Verify `isWaitingForUserInput` is true
- Check if message types are correct

---

## API Testing

### Initialize Investigation

```bash
curl -X POST http://localhost:3000/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "caseSetup": {
      "title": "Did you cheat?",
      "personAName": "Alex",
      "personBName": "Jordan",
      "personAArgument": "I saw you texting your ex",
      "personBArgument": "I never texted my ex",
      "mood": "serious"
    },
    "isInitialization": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "judgeResponse": {
    "speaker": "judge",
    "message": "This court is now in session...",
    "messageType": "statement",
    "intensity": 70,
    "tone": "investigative"
  },
  "updatedState": {
    "caseAnchor": {
      "contradictions": [...],
      "unresolvedQuestions": [...]
    },
    "judgeConfidence": {
      "overall": 20,
      "reasoning": ["Investigation beginning"]
    }
  }
}
```

### Submit User Input

```bash
curl -X POST http://localhost:3000/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "state": {...courtState...},
    "userInput": {
      "speaker": "userA",
      "content": "I swear I saw the message on their phone"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "judgeResponse": {
    "speaker": "judge",
    "message": "Describe what you saw on the phone...",
    "messageType": "question",
    "requiresUserResponse": true,
    "nextTarget": "userA"
  },
  "updatedState": {
    "judgeConfidence": {
      "overall": 35,
      "reasoning": ["Contradiction addressed", "More evidence needed"]
    }
  }
}
```

---

## Performance Metrics

Track these to verify system health:

1. **Average Questions per Case**: Should be 4-6 before verdict
2. **Contradiction Detection Rate**: 100% of real contradictions
3. **Judge Confidence Growth**: Should increase steadily
4. **Message Lengths**: Should average < 2 sentences
5. **User Interaction Control**: Judge asks for input, doesn't repeat

---

## Verdict Quality Checklist

Before declaring system successful, verify verdicts:

- [ ] Reference specific case details
- [ ] Acknowledge both perspectives
- [ ] Address emotional concerns
- [ ] Explain confidence level
- [ ] Provide reasoning, not just judgment
- [ ] Feel informed and fair

---

## Common Issues & Fixes

### Issue: Gemini returns plain text instead of JSON

**Fix**: Update prompt in `investigativeGeminiService.ts` to require JSON with explicit example

### Issue: Judge asks same question twice

**Fix**: Add questions to `unresolvedQuestions` with status 'resolved' after answered

### Issue: User never gets asked to respond

**Fix**: Check if `judgeResponse.requiresUserResponse` is true and `nextTarget` is set

### Issue: Case anchor never updates

**Fix**: Verify `orchestrateNextTurn()` returns updated state, and store actually uses it

### Issue: Judge confidence stuck at 75%

**Fix**: Ensure `calculateJudgeConfidence()` is called with current turn count and phase

---

## Manual Testing Workflow

1. **Open courtroom page**
   - Verify judge confidence displays
   - Verify initial message appears
   - Confirm no generic filler

2. **Review first judge message**
   - Should reference case title/details
   - Should mention investigation beginning
   - Should NOT ask user immediately

3. **Submit user input**
   - Judge should acknowledge
   - Judge should ask follow-up
   - Confidence should increase

4. **Continue 3-5 more turns**
   - Questions should get progressively more specific
   - Contradictions should be addressed
   - Judge confidence should reach 70%+

5. **Judge delivers verdict**
   - Should include case details
   - Should explain reasoning
   - Should feel fair

---

## Success Criteria

### The system is working when:

1. ✅ Judge asks 4-6 contextual questions per case
2. ✅ Contradictions are detected and challenged
3. ✅ Questions reference actual case details
4. ✅ Judge confidence grows 10-15% per turn
5. ✅ No generic filler dialogue appears
6. ✅ Verdict appears when confidence >= 75%
7. ✅ User feels: "The judge understood my situation"

---

**Ready to test. Report issues to system logs.**
