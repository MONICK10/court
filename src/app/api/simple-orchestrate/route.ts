/**
 * SIMPLIFIED ORCHESTRATION API
 * 
 * Endpoint for all AI interactions.
 * Receives case memory and instruction, returns AI response.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CaseMemory } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Build context-rich prompt for Gemini
 */
function buildPrompt(
  role: 'judge' | 'lawyerA' | 'lawyerB',
  caseMemory: CaseMemory,
  specificInstruction?: string
): string {
  const { personA, personB, title, contradictions, conversationHistory } = caseMemory

  // Build conversation history string
  const historyText = conversationHistory
    .map(msg => `${msg.speaker.toUpperCase()}: ${msg.text}`)
    .join('\n\n')

  const contradictionsText = contradictions.length > 0 
    ? `\nCONTRADICTIONS DETECTED:\n${contradictions.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : ''

  let systemPrompt = ''

  if (role === 'judge') {
    systemPrompt = `You are a Judge in an AI courtroom. You investigate disputes.
Your tone is: investigative, empathetic, and sharp.

CURRENT CASE: "${title}"

PERSON A (${personA.name}): "${personA.statement}"
PERSON B (${personB.name}): "${personB.statement}"
${contradictionsText}

CONVERSATION SO FAR:
${historyText || '(Investigation just starting)'}

YOUR JOB RIGHT NOW:
${specificInstruction || 'Continue the investigation appropriately based on the current state.'}

CRITICAL RULES:
- NEVER use generic courtroom phrases like "Let me provide context" or "The situation is nuanced"
- ALWAYS reference specific facts from the statements
- Keep responses SHORT (2-3 sentences max for questions, 3-4 for statements)
- Be direct and investigative
- Challenge contradictions immediately`
  } 
  else if (role === 'lawyerA') {
    systemPrompt = `You are Lawyer for ${personA.name}.
Your job: Summarize their side in 2 sentences max. Use their actual words.
Stay factual. Don't exaggerate.

Their statement: "${personA.statement}"

Write a SHORT, factual summary as their lawyer. Reference what they actually said.`
  } 
  else if (role === 'lawyerB') {
    systemPrompt = `You are Lawyer for ${personB.name}.
Your job: Summarize their side in 2 sentences max. Use their actual words.
Stay factual. Don't exaggerate.

Their statement: "${personB.statement}"

Write a SHORT, factual summary as their lawyer. Reference what they actually said.`
  }

  return systemPrompt
}

/**
 * Call Gemini API
 */
async function callGemini(
  role: 'judge' | 'lawyerA' | 'lawyerB',
  caseMemory: CaseMemory,
  specificInstruction?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const prompt = buildPrompt(role, caseMemory, specificInstruction)

  console.log('🌐 Calling Gemini API:', { role, promptLength: prompt.length })
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    console.log('📡 Gemini response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini error response:', errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Gemini response received')
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('❌ No text in response:', data)
      throw new Error('No response text from Gemini')
    }

    return text
  } catch (error) {
    console.error('❌ Gemini call error:', error)
    throw error
  }
}

/**
 * Detect contradictions
 */
async function detectContradictions(
  personAStatement: string,
  personBStatement: string,
  caseTitle: string
): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const prompt = `Analyze these two statements and find contradictions:

Case: "${caseTitle}"

Person A says: "${personAStatement}"
Person B says: "${personBStatement}"

List any contradictions. Be specific.
Format each as: "[What was claimed] vs [conflicting claim]"
If no contradictions, respond with: "No contradictions detected"`

  console.log('🌐 Calling Gemini API for contradiction detection')
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    console.log('📡 Gemini response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini error response:', errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Gemini response received:', data)
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (text.includes('No contradictions detected')) {
      return []
    }

    // Parse contradictions from response
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim())
  } catch (error) {
    console.error('❌ Contradiction detection error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, role, caseMemory, instruction } = body

    console.log('📥 API received:', { action, role: role || 'N/A' })

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment')
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    if (action === 'call-gemini') {
      console.log('🤖 Calling Gemini as', role)
      const response = await callGemini(role, caseMemory, instruction)
      return NextResponse.json({ success: true, response })
    }

    if (action === 'detect-contradictions') {
      console.log('🔍 Detecting contradictions')
      const { personAStatement, personBStatement, caseTitle } = body
      const contradictions = await detectContradictions(
        personAStatement,
        personBStatement,
        caseTitle
      )
      return NextResponse.json({ success: true, contradictions })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ API Error:', errorMsg, error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
