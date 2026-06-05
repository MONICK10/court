import { NextRequest, NextResponse } from 'next/server'
import { CaseMemory, CourtPhase } from '@/types'
import { callAI } from '@/utils/aiServiceClient'

function tamilInstruction(language?: string): string {
  if (language !== 'tamil') return ''
  return `\nLANGUAGE RULE: Reply ONLY in Tamil script (தமிழ்). The user may type in English letters to write Tamil words (Tanglish like "naan correct thaan" or "avan late aayitan") — understand it as Tamil and always reply in proper Tamil script. Use simple spoken Tamil, not formal written Tamil. Keep sentences short.\n`
}

function buildPhasePrompt(
  role: 'judge' | 'lawyerA' | 'lawyerB',
  caseMemory: CaseMemory,
  phase: CourtPhase,
  subRole?: string
): string {
  const { personA, personB, title, contradictions, conversationHistory, evidence, mood, language } = caseMemory

  const historyText = conversationHistory
    .map((msg) => `${msg.speaker.toUpperCase()}: ${msg.text}`)
    .join('\n\n')

  const contradictionsText =
    contradictions.length > 0
      ? `\nKEY CONTRADICTIONS:\n${contradictions.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      : ''

  const evidenceText =
    evidence.length > 0
      ? `\nEVIDENCE SUBMITTED:\n${evidence.map((e) => `- ${e.uploadedBy}: ${e.description}`).join('\n')}`
      : ''

  const tamil = language === 'tamil'
    ? `\nLANGUAGE: Reply ONLY in Tamil script (தமிழ்). User may type Tanglish (English letters for Tamil words like "naan correct thaan") — understand it and always reply in Tamil script. Use simple spoken Tamil. Keep it short.\n`
    : ''

  if (phase === 'opening') {
    return `${tamil}You are a Judge. Open the court in 2 short sentences. Plain spoken words.
${personA.name} says: "${personA.statement}"
${personB.name} says: "${personB.statement}"
Sentence 1: what this fight is about — use their names.
Sentence 2: what you will decide. No jargon.`
  }

  if (phase === 'investigation') {
    return `${tamil}You are a Judge asking ${personA.name} one short question. Like talking face-to-face.
${personA.name} said: "${personA.statement}"
${personB.name} said: "${personB.statement}"
${historyText ? `So far:\n${historyText}` : ''}
Ask ONE question — max 2 sentences. Point to one thing that doesn't add up.
No compound questions. No formal words. Mode: ${mood}.`
  }

  if (phase === 'crossExamination') {
    return `${tamil}You are a Judge asking ${personB.name} one short question. Like talking face-to-face.
${personB.name} said: "${personB.statement}"
${historyText ? `So far:\n${historyText}` : ''}
Ask ONE question — max 2 sentences. Pick one gap in what they said.
Plain words. Short. Mode: ${mood}.`
  }

  if (phase === 'evidence') {
    return `${tamil}You are a Judge reacting to evidence. 2 short sentences only.
Evidence: ${evidenceText || 'none'}
What does this prove or break? Simple words. No formal language.`
  }

  if (phase === 'finalStatements') {
    if (subRole === 'inviteB') {
      return `${tamil}You are a Judge. One sentence: invite ${personB.name} to give their final word.`
    }
    return `${tamil}You are a Judge. One sentence: invite ${personA.name} to give their final word.`
  }

  if (phase === 'verdict') {
    const moodTone = mood === 'funny' ? 'a little witty' : mood === 'savage' ? 'blunt and harsh' : mood === 'drama' ? 'dramatic' : 'calm and direct'
    return `${tamil}You are a Judge giving your final verdict. Tone: ${moodTone}. Max 5 lines. Plain words.
${personA.name} said: "${personA.statement}"${personA.finalStatement ? ` / Final: "${personA.finalStatement}"` : ''}
${personB.name} said: "${personB.statement}"${personB.finalStatement ? ` / Final: "${personB.finalStatement}"` : ''}
${evidenceText}
Write in this exact format:
[1-2 lines: what happened — names and plain facts]
[1 line: who was wrong, who was right]
[1 line: what the wrong one must do]
WINNER: [name]
LOSER: [name]
If both at fault: WINNER: Both need to fix this / LOSER: Both`
  }

  return `You are a courtroom participant in phase: ${phase}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, caseMemory, phase, role, subRole, verdictText } = body

    console.log('📥 API received:', { action, phase, role: role || 'N/A' })

    if (action === 'call-gemini-phase') {
      const prompt = buildPhasePrompt(role || 'judge', caseMemory, phase, subRole)
      console.log('🤖 Calling AI for phase:', phase, subRole ? `(${subRole})` : '')

      const response = await callAI(prompt)
      return NextResponse.json({ success: true, response })
    }

    if (action === 'parse-verdict') {
      const personAName = caseMemory?.personA?.name || ''
      const personBName = caseMemory?.personB?.name || ''

      const parsePrompt = `Parse this verdict and return ONLY valid JSON (no markdown, no code blocks):

VERDICT:
${verdictText}

Person A is: "${personAName}"
Person B is: "${personBName}"

Rules:
- If WINNER line contains "${personAName}", set winner to "personAFavored"
- If WINNER line contains "${personBName}", set winner to "personBFavored"
- If WINNER says "Both" or similar, set winner to "sharedResponsibility"
- Extract 1 court order from the "must do" sentence for the loser

Return exactly:
{
  "winner": "personAFavored" | "personBFavored" | "sharedResponsibility",
  "facts": [],
  "contradictions": [],
  "emotionalAnalysis": "",
  "responsibilityAnalysis": "",
  "courtOrders": [
    {"description": "what the loser must do", "assignedTo": "personA" | "personB" | "both"}
  ]
}`

      const parsedResponse = await callAI(parsePrompt)

      let verdictData
      try {
        verdictData = JSON.parse(parsedResponse)
      } catch {
        const jsonMatch = parsedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          verdictData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse verdict JSON')
        }
      }

      verdictData.verdictText = verdictText
      verdictData.timestamp = Date.now()
      verdictData.courtOrders = (verdictData.courtOrders || []).map((order: any, idx: number) => ({
        id: `order-${Date.now()}-${idx}`,
        description: order.description,
        assignedTo: order.assignedTo || 'both',
        completed: false,
        createdAt: Date.now(),
      }))

      return NextResponse.json({ success: true, verdictData })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ API Error:', errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
