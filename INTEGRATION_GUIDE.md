# INTEGRATION GUIDE - Using the Core Engine

This guide shows how to integrate the CORE ENGINE into your existing Next.js pages and components.

---

## Quick Start

### 1. Initialize Session

When user clicks "Start Case" on landing page:

```tsx
// pages/courtroom/page.tsx
'use client'

import { useCourtroomStore } from '@/hooks/useCourtroomStore'
import { CaseSetup } from '@/types'

export default function CourtroomPage() {
  const { initializeSession, caseSetup, memory } = useCourtroomStore()

  // Initialize from setup data (passed via params or state)
  React.useEffect(() => {
    const setup: CaseSetup = {
      title: 'Relationship Case',
      personAName: 'Alex',
      personBName: 'Jordan',
      personAArgument: 'You never listen to me...',
      personBArgument: 'You\'re always too demanding...',
      mood: 'serious'
    }

    initializeSession(setup)
  }, [])

  if (!memory) return <div>Initializing...</div>

  return (
    <CourtroomSession />
  )
}
```

---

## 2. Render Courtroom Messages

```tsx
// components/CourtroomSession.tsx
'use client'

import { useCourtroomStore } from '@/hooks/useCourtroomStore'
import { CourtroomLayout } from '@/components/CourtroomLayout'
import { LawyerBubble } from '@/components/LawyerBubble'
import { JudgePanel } from '@/components/JudgePanel'
import { TypingAnimation } from '@/components/TypingAnimation'
import { UserInputPrompt } from '@/components/UserInputPrompt'

export function CourtroomSession() {
  const { messages, isWaitingForUserInput, isLoading } = useCourtroomStore()

  return (
    <CourtroomLayout>
      <div className="courtroom-messages">
        {messages.map(message => (
          <MessageComponent key={message.id} message={message} />
        ))}
      </div>

      {isLoading && <LoadingIndicator />}

      {isWaitingForUserInput && !isLoading && (
        <UserInputSection />
      )}
    </CourtroomLayout>
  )
}

function MessageComponent({ message }) {
  switch (message.speaker) {
    case 'judge':
      return <JudgePanel message={message.message} />
    case 'lawyerA':
      return <LawyerBubble side="left" message={message.message} intensity="high" />
    case 'lawyerB':
      return <LawyerBubble side="right" message={message.message} intensity="medium" />
    case 'userA':
      return <UserBubble side="left" message={message.message} />
    case 'userB':
      return <UserBubble side="right" message={message.message} />
  }
}
```

---

## 3. User Input Section

```tsx
// components/UserInputSection.tsx
'use client'

import { useCourtroomStore } from '@/hooks/useCourtroomStore'
import { useState } from 'react'

export function UserInputSection() {
  const { memory, selectedUserOption, selectUserOption, submitUserInput } = useCourtroomStore()
  const [inputText, setInputText] = useState('')
  const [activeUser, setActiveUser] = useState<'A' | 'B'>('A')

  if (!memory) return null

  const personAName = memory.caseSetup.personAName
  const personBName = memory.caseSetup.personBName

  // Show two options first
  if (selectedUserOption === null) {
    return (
      <div className="user-decision-panel">
        <p>What do you want to do?</p>
        
        <button onClick={() => selectUserOption('speak')} className="btn-primary">
          You Want To Say Something?
        </button>

        <button onClick={() => selectUserOption('continue')} className="btn-secondary">
          Lawyer Continues
        </button>
      </div>
    )
  }

  // Show input form if they chose "speak"
  if (selectedUserOption === 'speak') {
    return (
      <div className="user-input-panel">
        <div className="person-selector">
          <button
            className={`person-btn ${activeUser === 'A' ? 'active' : ''}`}
            onClick={() => setActiveUser('A')}
          >
            {personAName}
          </button>
          <button
            className={`person-btn ${activeUser === 'B' ? 'active' : ''}`}
            onClick={() => setActiveUser('B')}
          >
            {personBName}
          </button>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`${activeUser === 'A' ? personAName : personBName}, what do you want to say?`}
          className="input-field"
        />

        <div className="input-actions">
          <button
            onClick={() => submitUserInput(activeUser, inputText)}
            disabled={!inputText.trim()}
            className="btn-primary"
          >
            Submit
          </button>

          <button
            onClick={() => setInputText('')}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>
    )
  }

  return null
}
```

---

## 4. Connect to Orchestrator API

The store handles this automatically, but here's how it works:

```tsx
// When user submits input:
const handleSubmit = async (speaker: 'A' | 'B', content: string) => {
  // This function in the store:
  const { submitUserInput } = useCourtroomStore()
  
  // 1. Adds user message to UI
  // 2. Calls fetchNextTurn with user input
  // 3. fetchNextTurn calls: POST /api/orchestrate with { memory, userInput }
  // 4. API returns: { response, updatedMemory }
  // 5. Store updates with new message and memory
  
  await submitUserInput(speaker, content)
}

// When user clicks "Lawyer Continues":
const handleContinue = async () => {
  const { selectUserOption } = useCourtroomStore()
  
  // This calls fetchNextTurn WITHOUT user input
  // API orchestrator decides what happens next based on phase/memory
  
  await selectUserOption('continue')
}
```

---

## 5. Display Emotional Context

```tsx
// components/EmotionalIndicator.tsx
'use client'

export function EmotionalIndicator({ intensity, tone }) {
  const colors = {
    'aggressive': '#ff6b6b',
    'calm': '#4ecdc4',
    'curious': '#ffe66d',
    'emotional': '#ff85a1',
    'analytical': '#95e1d3',
  }

  return (
    <div
      className="emotional-indicator"
      style={{
        backgroundColor: colors[tone],
        opacity: Math.min(1, intensity / 100),
        height: `${Math.max(4, intensity / 25)}px`,
      }}
    />
  )
}
```

---

## 6. Monitor Session State

```tsx
// components/SessionDebugger.tsx
'use client'

import { useCourtroomStore } from '@/hooks/useCourtroomStore'

export function SessionDebugger() {
  const { getMemorySummary, memory } = useCourtroomStore()

  if (!memory) return null

  return (
    <details className="debug-panel">
      <summary>Session Debug Info</summary>
      <pre>{getMemorySummary()}</pre>
      <details>
        <summary>Memory (JSON)</summary>
        <pre>{JSON.stringify(memory, null, 2)}</pre>
      </details>
    </details>
  )
}
```

---

## 7. Phase Indicator

```tsx
// components/CourtroomPhaseIndicator.tsx
'use client'

import { useCourtroomStore } from '@/hooks/useCourtroomStore'

export function CourtroomPhaseIndicator() {
  const { memory } = useCourtroomStore()

  if (!memory) return null

  const phases = [
    'opening_statements',
    'lawyer_reframing',
    'cross_examination',
    'emotional_clarification',
    'final_arguments',
    'verdict',
  ]

  const currentIndex = phases.indexOf(memory.currentPhase)

  return (
    <div className="phase-indicator">
      <div className="phases">
        {phases.map((phase, index) => (
          <div
            key={phase}
            className={`phase ${
              index < currentIndex ? 'completed' : 
              index === currentIndex ? 'current' : 
              'upcoming'
            }`}
          >
            {phase.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      <div className="phase-info">
        Round {memory.round} • {memory.conversationHistory.length} messages
      </div>
    </div>
  )
}
```

---

## 8. Full Page Example

```tsx
// app/courtroom/page.tsx
'use client'

import { useEffect } from 'react'
import { useCourtroomStore } from '@/hooks/useCourtroomStore'
import { CourtroomLayout } from '@/components/CourtroomLayout'
import { CourtroomPhaseIndicator } from '@/components/CourtroomPhaseIndicator'
import { CourtroomSession } from '@/components/CourtroomSession'
import { UserInputSection } from '@/components/UserInputSection'
import { SessionDebugger } from '@/components/SessionDebugger'

export default function CourtroomPage() {
  const { caseSetup, memory, initializeSession, fetchNextTurn, error, isLoading } = useCourtroomStore()

  // Initialize session from router params or previous state
  useEffect(() => {
    if (!memory) {
      // Get case setup from somewhere (router, local state, etc.)
      const setup = getCaseSetupFromRoute()
      initializeSession(setup)
      
      // Start the case with judge's opening
      setTimeout(() => {
        fetchNextTurn()
      }, 500)
    }
  }, [memory])

  if (!memory) {
    return <div>Loading courtroom...</div>
  }

  return (
    <CourtroomLayout>
      <CourtroomPhaseIndicator />

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => {}}>Dismiss</button>
        </div>
      )}

      <CourtroomSession />

      <UserInputSection />

      <CourtroomPhaseIndicator />

      {process.env.NODE_ENV === 'development' && <SessionDebugger />}
    </CourtroomLayout>
  )
}

function getCaseSetupFromRoute() {
  // Get from router params or session storage
  return {
    title: 'Relationship Case',
    personAName: 'Alex',
    personBName: 'Jordan',
    personAArgument: 'User A argument',
    personBArgument: 'User B argument',
    mood: 'serious',
  }
}
```

---

## 9. Styling Recommendations

```tsx
// Tailwind classes for courtroom UI

const styles = {
  // Judge messages - centered, authoritative
  judge: 'bg-amber-900 text-amber-50 border-2 border-amber-700 rounded-lg p-4 my-4 max-w-2xl mx-auto',

  // Lawyer A (emotional) - left side, warmer
  lawyerA: 'bg-red-900 text-red-50 rounded-lg p-4 my-3 max-w-lg mr-auto',

  // Lawyer B (analytical) - right side, cooler  
  lawyerB: 'bg-blue-900 text-blue-50 rounded-lg p-4 my-3 max-w-lg ml-auto',

  // User messages - muted background
  userA: 'bg-gray-800 text-gray-200 rounded-lg p-4 my-3 max-w-lg mr-auto border-l-4 border-red-500',
  userB: 'bg-gray-800 text-gray-200 rounded-lg p-4 my-3 max-w-lg ml-auto border-l-4 border-blue-500',

  // User decision panel
  userPanel: 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-amber-700 p-6 flex gap-4 justify-center',
}
```

---

## 10. Error Handling

```tsx
// The store manages errors automatically
const { error, setError } = useCourtroomStore()

// But you can handle specific errors:
const submitWithErrorHandling = async (speaker: 'A' | 'B', content: string) => {
  try {
    await submitUserInput(speaker, content)
  } catch (err) {
    console.error('Failed to submit:', err)
    // Retry logic here if needed
  }
}
```

---

## Testing the Integration

1. **Start Session**
   ```tsx
   const { initializeSession } = useCourtroomStore()
   initializeSession(mockCaseSetup)
   ```

2. **Verify Memory**
   ```tsx
   const { memory } = useCourtroomStore()
   console.log(memory.sessionId) // Should exist
   console.log(memory.currentPhase) // Should be 'opening_statements'
   ```

3. **Fetch First Turn**
   ```tsx
   const { fetchNextTurn } = useCourtroomStore()
   await fetchNextTurn()
   ```

4. **Submit User Input**
   ```tsx
   const { submitUserInput } = useCourtroomStore()
   await submitUserInput('A', 'User statement here')
   ```

5. **Check Messages**
   ```tsx
   const { messages } = useCourtroomStore()
   console.log(messages.length) // Should increase
   ```

---

## Debugging Checklist

- [ ] Memory is initialized
- [ ] First orchestrator response appears in console
- [ ] User messages are added to store
- [ ] Phase indicator updates correctly
- [ ] Emotional intensity changes with input
- [ ] User options appear at right time
- [ ] Lawyer continues option works
- [ ] Phase advancement happens
- [ ] Verdict is generated

---

## Next: AI Integration

To add real AI responses instead of mock responses:

1. Update `courtroomOrchestrator.ts` to call Gemini API
2. Pass `getMemorySummary()` to LLM prompt
3. Parse LLM response into `OrchestratorResponse` format
4. Fall back to rule-based responses if LLM fails

See `CORE_ENGINE.md` for AI integration prompt template.
