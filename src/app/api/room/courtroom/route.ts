import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom, RoomCourtroomState, RoomMessage } from '@/lib/roomStore'
import { callAI } from '@/utils/aiServiceClient'

// ==========================================
// PROMPT BUILDERS
// ==========================================

function buildPrompt(phase: string, subRole: string | undefined, room: NonNullable<ReturnType<typeof getRoom>>) {
  const { courtName, personA, personB, mood } = room
  const cs = room.courtroomState!
  const nameA = personA.name
  const nameB = personB!.name
  const stmtA = personA.statement!
  const stmtB = personB!.statement!
  const history = cs.conversationHistory.map(m => `${m.speaker.toUpperCase()}: ${m.text}`).join('\n\n')
  const evidenceText = cs.evidence.length > 0
    ? `\nEVIDENCE:\n${cs.evidence.map(e => `- Person ${e.uploadedBy}: ${e.description}`).join('\n')}`
    : ''
  const moodStyle = mood === 'funny' ? 'a little witty' : mood === 'savage' ? 'blunt and harsh' : mood === 'drama' ? 'dramatic' : 'calm and direct'
  const tamil = room.language === 'tamil'
    ? `\nLANGUAGE: Reply ONLY in Tamil script (தமிழ்). User may type Tanglish — understand it and reply in Tamil script. Simple spoken Tamil. Short.\n`
    : ''

  if (phase === 'opening') {
    return `${tamil}You are a Judge. Open the court in 2 short sentences. Plain spoken words.
${nameA} says: "${stmtA}"
${nameB} says: "${stmtB}"
Sentence 1: what this fight is about — use their names.
Sentence 2: what you will decide. No jargon.`
  }

  if (phase === 'investigation') {
    return `${tamil}You are a Judge asking ${nameA} one question. Like talking face-to-face.
${nameA} said: "${stmtA}"
${nameB} said: "${stmtB}"
${history ? `So far:\n${history}` : ''}
Ask ONE question — max 2 sentences. One thing that doesn't add up. Plain words. Style: ${moodStyle}.`
  }

  if (phase === 'crossExamination') {
    return `${tamil}You are a Judge asking ${nameB} one question. Like talking face-to-face.
${nameB} said: "${stmtB}"
${history ? `So far:\n${history}` : ''}
Ask ONE short question — max 2 sentences. Pick one gap in what THEY said.
Plain words. Short and punchy. Sounds natural spoken aloud. Style: ${moodStyle}.`
  }

  if (phase === 'evidence') {
    return `${tamil}You are a Judge reacting to evidence. 2 short sentences.
Evidence: ${evidenceText || 'none'}
What does this prove or break? Simple words.`
  }

  if (phase === 'finalStatements') {
    if (subRole === 'inviteB') {
      return `${tamil}You are a Judge. One sentence: invite ${nameB} for their final word.`
    }
    return `${tamil}You are a Judge. One sentence: invite ${nameA} for their final word.`
  }

  if (phase === 'verdict') {
    const histArr = cs.conversationHistory
    const aFinal = [...histArr].reverse().find((m: RoomMessage) => m.speaker === 'userA')?.text || ''
    const bFinal = [...histArr].reverse().find((m: RoomMessage) => m.speaker === 'userB')?.text || ''
    return `${tamil}You are a Judge giving your verdict. Tone: ${moodStyle}. Max 5 lines. Plain words.
${nameA} said: "${stmtA}"${aFinal ? ` / Final: "${aFinal}"` : ''}
${nameB} said: "${stmtB}"${bFinal ? ` / Final: "${bFinal}"` : ''}
${evidenceText}
Write in this exact format:
[1-2 lines: what happened — names and plain facts]
[1 line: who was wrong, who was right]
[1 line: what the wrong one must do]
WINNER: [name]
LOSER: [name]
If both at fault: WINNER: Both need to fix this / LOSER: Both`
  }

  return `You are a courtroom judge.`
}

// ==========================================
// PHASE ORCHESTRATION
// ==========================================

async function runJudge(room: NonNullable<ReturnType<typeof getRoom>>, phase: string, subRole?: string): Promise<string> {
  const apiKey = room.personA.apiKey ?? room.personB?.apiKey
  const prompt = buildPrompt(phase, subRole, room)
  return callAI(prompt, apiKey)
}

async function parseCourtOrders(
  verdictText: string,
  apiKey: string | undefined,
  nameA: string,
  nameB: string
): Promise<Array<{ description: string; assignedTo: 'A' | 'B' | 'both' }>> {
  const prompt = `Extract actionable penalties or tasks from this verdict.

VERDICT:
${verdictText}

Person A = "${nameA}", Person B = "${nameB}"

Return ONLY a valid JSON array (no markdown, no code blocks):
[{"description": "what they must do", "assignedTo": "A" | "B" | "both"}]

Only include real tasks/penalties (like apologies, situps, no-phone rules, etc.).
If none exist, return [].`

  try {
    const response = await callAI(prompt, apiKey)
    const match = response.match(/\[[\s\S]*\]/)
    const json = match ? JSON.parse(match[0]) : JSON.parse(response)
    return Array.isArray(json) ? json : []
  } catch {
    return []
  }
}

function addMessage(cs: RoomCourtroomState, speaker: string, text: string) {
  cs.conversationHistory.push({ speaker, text, timestamp: Date.now() })
  cs.lastUpdated = Date.now()
}

async function initializeCourtroom(code: string) {
  const room = getRoom(code)!
  const cs: RoomCourtroomState = {
    conversationHistory: [],
    currentPhase: 'opening',
    waitingFor: null,
    waitingForEvidence: false,
    evidenceRequester: null,
    crossExamRound: 0,
    isProcessing: true,
    contradictions: [],
    evidence: [],
    courtOrders: [],
    lastUpdated: Date.now(),
  }
  updateRoom(code, { courtroomState: cs })

  const judgeSummary = await runJudge({ ...room, courtroomState: cs }, 'opening')
  addMessage(cs, 'judge', judgeSummary)
  cs.waitingFor = 'A'
  cs.isProcessing = false
  updateRoom(code, { courtroomState: { ...cs } })
}

// ==========================================
// GET — poll courtroom state
// ==========================================

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const room = getRoom(code)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  if (!room.courtroomState && room.status === 'in_court') {
    // Initialize asynchronously — caller will get empty state first poll
    initializeCourtroom(code).catch(console.error)
    return NextResponse.json({ initializing: true })
  }

  if (!room.courtroomState) {
    return NextResponse.json({ error: 'Courtroom not started' }, { status: 400 })
  }

  const cs = room.courtroomState
  return NextResponse.json({
    conversationHistory: cs.conversationHistory,
    currentPhase: cs.currentPhase,
    waitingFor: cs.waitingFor,
    waitingForEvidence: cs.waitingForEvidence,
    evidenceRequester: cs.evidenceRequester,
    crossExamRound: cs.crossExamRound,
    isProcessing: cs.isProcessing,
    verdict: cs.verdict ?? null,
    courtOrders: cs.courtOrders,
    lastUpdated: cs.lastUpdated,
    personAName: room.personA.name,
    personBName: room.personB!.name,
    courtName: room.courtName,
    mood: room.mood,
    language: room.language,
  })
}

// ==========================================
// POST — submit input or continue after evidence
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, person, action, text, evidenceDescription } = body

    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (!room.courtroomState) return NextResponse.json({ error: 'Courtroom not started' }, { status: 400 })

    const cs = { ...room.courtroomState }
    if (cs.isProcessing) return NextResponse.json({ error: 'Processing, please wait' }, { status: 409 })

    cs.isProcessing = true
    cs.lastUpdated = Date.now()
    updateRoom(code, { courtroomState: { ...cs } })

    try {
      if (action === 'submit_input') {
        const speaker = person === 'A' ? 'userA' : 'userB'
        addMessage(cs, speaker, text)

        if (cs.currentPhase === 'opening') {
          if (person === 'A') {
            cs.waitingFor = 'B'
          } else {
            // Both opened → start investigation
            const judgeQ = await runJudge({ ...room, courtroomState: cs }, 'investigation')
            addMessage(cs, 'judge', judgeQ)
            cs.currentPhase = 'investigation'
            cs.waitingFor = 'A'
          }

        } else if (cs.currentPhase === 'investigation') {
          cs.waitingForEvidence = true
          cs.evidenceRequester = 'A'
          cs.waitingFor = null

        } else if (cs.currentPhase === 'crossExamination') {
          cs.waitingForEvidence = true
          cs.evidenceRequester = 'B'
          cs.waitingFor = null

        } else if (cs.currentPhase === 'finalStatements') {
          if (person === 'A') {
            const judgeInviteB = await runJudge({ ...room, courtroomState: cs }, 'finalStatements', 'inviteB')
            addMessage(cs, 'judge', judgeInviteB)
            cs.waitingFor = 'B'
          } else {
            // Both closed → verdict
            const verdictText = await runJudge({ ...room, courtroomState: cs }, 'verdict')
            addMessage(cs, 'judge', verdictText)
            cs.currentPhase = 'verdict'
            cs.waitingFor = null
            // Parse winner/loser
            const winnerLine = verdictText.match(/WINNER:\s*(.+)/i)?.[1]?.trim() ?? ''
            const nameA = room.personA.name
            const nameB = room.personB!.name
            const winner = winnerLine.toLowerCase().includes(nameA.toLowerCase()) ? 'A'
              : winnerLine.toLowerCase().includes(nameB.toLowerCase()) ? 'B' : 'shared'
            cs.verdict = {
              text: verdictText,
              winner,
              winnerName: winner === 'A' ? nameA : winner === 'B' ? nameB : 'Both',
              loserName: winner === 'A' ? nameB : winner === 'B' ? nameA : 'Both',
            }
            // Parse court orders / penalties
            const apiKey = room.personA.apiKey ?? room.personB?.apiKey
            const rawOrders = await parseCourtOrders(verdictText, apiKey, nameA, nameB)
            cs.courtOrders = rawOrders.map((o, i) => ({
              id: `order-${Date.now()}-${i}`,
              description: o.description,
              assignedTo: o.assignedTo,
              assignedName: o.assignedTo === 'A' ? nameA : o.assignedTo === 'B' ? nameB : 'Both',
              completed: false,
            }))
          }
        }

      } else if (action === 'raise_objection') {
        // Only valid during investigation / crossExamination
        if (cs.currentPhase !== 'investigation' && cs.currentPhase !== 'crossExamination') {
          cs.isProcessing = false
          updateRoom(code, { courtroomState: { ...cs } })
          return NextResponse.json({ error: 'Objections only during investigation' }, { status: 400 })
        }
        const speakerKey = person === 'A' ? 'userA' : 'userB'
        const speakerName = person === 'A' ? room.personA.name : room.personB!.name
        addMessage(cs, speakerKey, 'OBJECTION!')
        const lastJudge = [...cs.conversationHistory].reverse().find(m => m.speaker === 'judge')?.text ?? ''
        const moodStyle = room.mood === 'funny' ? 'witty' : room.mood === 'savage' ? 'harsh and blunt' : room.mood === 'drama' ? 'dramatic' : 'measured'
        const apiKey = room.personA.apiKey ?? room.personB?.apiKey
        const objPrompt = `You are a Judge. ${speakerName} just raised an OBJECTION.
Your last statement was: "${lastJudge}"
Address the objection firmly in 1 sentence. Then immediately re-ask your question in 1 sentence.
Style: ${moodStyle}. No jargon. Spoken out loud.`
        const judgeReply = await callAI(objPrompt, apiKey)
        addMessage(cs, 'judge', judgeReply)
        // Keep waiting for same person — objection doesn't advance phase
        cs.waitingFor = person

      } else if (action === 'continue_after_evidence') {
        if (evidenceDescription) {
          const ev = {
            uploadedBy: (person as 'A' | 'B'),
            description: evidenceDescription,
            timestamp: Date.now(),
          }
          cs.evidence.push(ev)
          const analysisRoom = { ...room, courtroomState: cs }
          const analysis = await runJudge(analysisRoom, 'evidence')
          addMessage(cs, 'judge', analysis)
        }

        cs.waitingForEvidence = false
        cs.evidenceRequester = null

        if (cs.currentPhase === 'investigation') {
          // Move to cross-examination
          cs.crossExamRound++
          const crossQ = await runJudge({ ...room, courtroomState: cs }, 'crossExamination')
          addMessage(cs, 'judge', crossQ)
          cs.currentPhase = 'crossExamination'
          cs.waitingFor = 'B'

        } else if (cs.currentPhase === 'crossExamination') {
          cs.crossExamRound++
          if (cs.crossExamRound >= 2) {
            // Move to closing statements
            const judgeInviteA = await runJudge({ ...room, courtroomState: cs }, 'finalStatements', 'inviteA')
            addMessage(cs, 'judge', judgeInviteA)
            cs.currentPhase = 'finalStatements'
            cs.waitingFor = 'A'
          } else {
            // Another round
            const crossQ = await runJudge({ ...room, courtroomState: cs }, 'crossExamination')
            addMessage(cs, 'judge', crossQ)
            cs.waitingFor = 'B'
          }
        }
      }

    } finally {
      cs.isProcessing = false
      cs.lastUpdated = Date.now()
      updateRoom(code, { courtroomState: { ...cs } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
