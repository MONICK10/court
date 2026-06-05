# Documentation Index - AI Relationship Court Investigation System

## 📚 Quick Navigation

### For Users
- **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** - Visual summary of transformation
- **[INVESTIGATION_README.md](./INVESTIGATION_README.md)** - User-facing introduction
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - How to test the system

### For Developers
- **[INVESTIGATION_SYSTEM.md](./INVESTIGATION_SYSTEM.md)** - Complete technical architecture
- **[TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md)** - What changed and why
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Launch readiness

### For Reference
- **[README.md](./README.md)** - Original project setup
- **[TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)** - Original specifications

---

## 📖 DOCUMENTATION SUMMARIES

### 1. SYSTEM_OVERVIEW.md
**Quick visual guide to the transformation**

**Contains:**
- Before/After comparison
- Core systems diagram
- Investigation flow chart
- User experience comparison
- Systems at work visualization
- Verdict conditions
- Success indicators
- Deployment status

**Best for:** Quick understanding of what changed

**Time to read:** 5 minutes

---

### 2. INVESTIGATION_README.md
**Complete user-facing guide to the investigation system**

**Contains:**
- What changed (Before/After)
- Core experience walkthrough
- Five key systems explained
- User flow step-by-step
- No fixed time limits explanation
- Judge confidence display
- What you never see
- API endpoint documentation
- Testing instructions
- Technical architecture
- Development guidelines
- Philosophy and principles

**Best for:** Understanding the full system

**Time to read:** 15 minutes

---

### 3. INVESTIGATION_SYSTEM.md
**Complete technical architecture documentation**

**Contains:**
- Transformation overview
- Core principle
- Detailed architecture (all 7 systems)
- CaseAnchor structure & functions
- JudgeConfidence structure & functions
- Targeted questioning types & functions
- Judge orchestrator decision flow
- Investigation-focused Gemini service
- Investigation store details
- Updated courtroom page details
- Flow comparison (Old vs New)
- Key changes list
- User experience improvements
- Technical improvements
- Gemini prompting strategy
- Verdict conditions
- File structure
- Next steps
- Success metrics
- System quote

**Best for:** Deep technical understanding

**Time to read:** 25 minutes

---

### 4. TESTING_GUIDE.md
**Complete testing documentation**

**Contains:**
- Quick start
- 3 example test cases
- What to monitor (good/bad signs)
- Debugging guide
- API testing examples (curl commands)
- Performance metrics to track
- Verdict quality checklist
- Common issues & fixes
- Manual testing workflow
- Success criteria

**Best for:** Running tests and debugging

**Time to read:** 20 minutes

---

### 5. TRANSFORMATION_SUMMARY.md
**What was done and why**

**Contains:**
- Transformation overview
- 10 major changes (what was created)
- Core principles implemented
- Removed systems
- Files created
- Files updated
- Files preserved
- Development status
- Testing instructions
- Key metrics
- Critical success factor
- What's different (Before/After flow)
- System philosophy
- Support documents
- Final notes

**Best for:** Understanding the scope of change

**Time to read:** 20 minutes

---

### 6. DEPLOYMENT_CHECKLIST.md
**Launch readiness verification**

**Contains:**
- Build & compilation status
- New systems created
- Documentation created
- Removed systems
- Pre-launch testing checklist
- Quality checks
- System readiness
- Critical success criteria
- Metrics to monitor
- Launch sequence
- Go/No-go decision
- Post-launch notes
- Success definition
- Deployment status

**Best for:** Verifying everything is ready

**Time to read:** 10 minutes

---

## 🗂️ FILE ORGANIZATION

### New Investigation System Files
```
src/utils/
  ├── caseAnchor.ts                    (380 lines)
  ├── judgeConfidence.ts               (280 lines)
  ├── targetedQuestions.ts             (290 lines)
  ├── newJudgeOrchestrator.ts          (420 lines)
  └── investigativeGeminiService.ts    (350 lines)

src/hooks/
  └── useInvestigationStore.ts         (260 lines)

src/app/
  └── courtroom/page.tsx               (Rewritten)

src/app/api/
  └── orchestrate/route.ts             (Updated)

src/components/
  └── UserInputPanel.tsx               (Updated)
```

### Documentation Files
```
SYSTEM_OVERVIEW.md                   (Visual summary)
INVESTIGATION_README.md              (User guide)
INVESTIGATION_SYSTEM.md              (Technical details)
TESTING_GUIDE.md                     (Testing & debugging)
TRANSFORMATION_SUMMARY.md            (Change summary)
DEPLOYMENT_CHECKLIST.md              (Launch readiness)
DOCUMENTATION_INDEX.md               (This file)
```

---

## 🎯 READING PATHS

### If you have 5 minutes
1. Read SYSTEM_OVERVIEW.md

### If you have 15 minutes
1. Read SYSTEM_OVERVIEW.md
2. Read INVESTIGATION_README.md (quick scan)

### If you have 30 minutes (First-time setup)
1. SYSTEM_OVERVIEW.md
2. INVESTIGATION_README.md
3. TESTING_GUIDE.md (quick scan)

### If you have 1 hour (Complete onboarding)
1. SYSTEM_OVERVIEW.md
2. INVESTIGATION_README.md
3. INVESTIGATION_SYSTEM.md
4. TESTING_GUIDE.md

### If you have 2 hours (Developer deep-dive)
1. TRANSFORMATION_SUMMARY.md
2. INVESTIGATION_SYSTEM.md
3. Code review (new files)
4. TESTING_GUIDE.md
5. DEPLOYMENT_CHECKLIST.md

### If you need to debug something
1. Jump to TESTING_GUIDE.md
2. Find issue in "Common Issues & Fixes"
3. Reference INVESTIGATION_SYSTEM.md for details

---

## ✨ KEY CONCEPTS QUICK REFERENCE

### CaseAnchor
**The foundation of investigation**
- Stores: core conflict, contradictions, questions, emotions
- Purpose: Keep responses anchored to actual conflict
- Location: `src/utils/caseAnchor.ts`

### JudgeConfidence
**Tracks investigation progress**
- Ranges: 0-100%
- Verdict ready: >= 75%
- Purpose: Dynamic pacing without fixed limits
- Location: `src/utils/judgeConfidence.ts`

### TargetedQuestions
**Intelligent questioning**
- Types: Contradiction, timeline, emotional, evidence, follow-up
- Rejects: Generic filler
- Purpose: Advance investigation
- Location: `src/utils/targetedQuestions.ts`

### JudgeOrchestrator
**Investigation director**
- Flow: Assess → Calculate → Decide → Generate response
- Controls: Who speaks, what to investigate, when to verdict
- Location: `src/utils/newJudgeOrchestrator.ts`

### InvestigativeGeminiService
**AI as orchestrator**
- Purpose: Analyze state, determine next action
- Prompts: Investigation-focused, not dialogue-focused
- Location: `src/utils/investigativeGeminiService.ts`

### InvestigationStore
**Frontend state management**
- Replaces: Old useCourtroomStore
- Manages: Cases, messages, user input, confidence
- Location: `src/hooks/useInvestigationStore.ts`

---

## 🔧 COMMON TASKS

### "I want to understand the full system"
→ Read INVESTIGATION_SYSTEM.md

### "I need to test a case"
→ Follow TESTING_GUIDE.md

### "I need to fix a bug"
→ See TESTING_GUIDE.md "Debugging" section

### "I want to see what changed"
→ Read TRANSFORMATION_SUMMARY.md

### "Is everything ready to launch?"
→ Check DEPLOYMENT_CHECKLIST.md

### "I want a quick overview"
→ Read SYSTEM_OVERVIEW.md

### "How do I use this as a user?"
→ Read INVESTIGATION_README.md

---

## 📊 DOCUMENTATION STATS

| Document | Lines | Focus | Audience |
|----------|-------|-------|----------|
| SYSTEM_OVERVIEW.md | 250 | Visual | Everyone |
| INVESTIGATION_README.md | 400 | Features | Users |
| INVESTIGATION_SYSTEM.md | 600 | Architecture | Developers |
| TESTING_GUIDE.md | 350 | Testing | QA/Developers |
| TRANSFORMATION_SUMMARY.md | 400 | Changes | Everyone |
| DEPLOYMENT_CHECKLIST.md | 350 | Readiness | DevOps |

**Total: ~2,350 lines of documentation**

---

## ✅ DOCUMENTATION COMPLETENESS

- [x] High-level overview
- [x] User-facing guide
- [x] Technical architecture
- [x] Testing procedures
- [x] Change documentation
- [x] Deployment readiness
- [x] API documentation
- [x] Code examples
- [x] Debugging guide
- [x] Success criteria
- [x] Philosophy & principles
- [x] Quick reference

**Status: COMPLETE**

---

## 🎓 LEARNING OUTCOMES

After reading all documentation, you will understand:

1. **What changed** - From roleplay to investigation system
2. **Why it changed** - To prevent generic filler
3. **How it works** - Judge-orchestrated investigation flow
4. **Key systems** - Case anchor, confidence, questioning
5. **Technical stack** - Gemini, Zustand, TypeScript
6. **How to test** - Example cases and verification
7. **How to debug** - Common issues and fixes
8. **When it's ready** - Launch criteria and metrics
9. **How users experience it** - Investigation → Verdict
10. **Core philosophy** - "Judge actually understands"

---

## 🚀 GETTING STARTED

### 1. Quick Start (5 min)
```bash
# Read SYSTEM_OVERVIEW.md
# Visit http://localhost:3000
```

### 2. Understand System (15 min)
```bash
# Read INVESTIGATION_README.md
# Browse INVESTIGATION_SYSTEM.md
```

### 3. Test System (20 min)
```bash
# Follow TESTING_GUIDE.md
# Run 3-5 test cases
```

### 4. Deploy (10 min)
```bash
# Check DEPLOYMENT_CHECKLIST.md
# Verify all items
# Launch!
```

---

## 📞 SUPPORT

### For questions about...
- **System design**: See INVESTIGATION_SYSTEM.md
- **How to test**: See TESTING_GUIDE.md
- **What changed**: See TRANSFORMATION_SUMMARY.md
- **Is it ready**: See DEPLOYMENT_CHECKLIST.md
- **User experience**: See INVESTIGATION_README.md
- **Quick overview**: See SYSTEM_OVERVIEW.md

### For debugging
1. Check TESTING_GUIDE.md "Common Issues"
2. Review relevant system in INVESTIGATION_SYSTEM.md
3. Check error logs and API responses
4. Verify test case in TESTING_GUIDE.md

---

## 📝 NOTES

- All documentation is written in Markdown
- All examples are tested and verified
- All metrics are based on system design
- All success criteria are realistic
- All assumptions are documented

---

**📚 Complete documentation set for AI Relationship Court Investigation System**

**Last Updated:** After complete architectural transformation
**Status:** READY FOR PRODUCTION
**Quality:** COMPLETE

🔍⚖️ Judge awaits cases to investigate.
