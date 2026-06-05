/**
 * SIMPLIFIED GEMINI SERVICE
 * 
 * Core functions for AI interaction:
 * - buildPrompt() - constructs context-rich prompts
 * - callGemini() - wrapper for API calls
 * - detectContradictions() - finds inconsistencies
 */

import { CaseMemory, ConversationMessage } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

/**
 * Build context-rich prompt for Gemini
 * This is the most important function - it ensures AI always has context
 */
export function buildPrompt(
  role: 'judge' | 'lawyerA' | 'lawyerB',
  caseMemory: CaseMemory,
  specificInstruction?: string
): string {
  const { personA, personB, title, contradictions, conversationHistory, currentState } = caseMemory

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
 * Call Gemini API with context-rich prompt
 */
export async function callGemini(
  role: 'judge' | 'lawyerA' | 'lawyerB',
  caseMemory: CaseMemory,
  specificInstruction?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set in environment')
  }

  const prompt = buildPrompt(role, caseMemory, specificInstruction)

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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response from Gemini')
    }

    return text
  } catch (error) {
    console.error('Gemini call failed:', error)
    throw error
  }
}

/**
 * Detect contradictions between two statements
 */
export async function detectContradictions(
  personAStatement: string,
  personBStatement: string,
  caseTitle: string
): Promise<string[]> {
  const prompt = `Analyze these two statements and find contradictions:

Case: "${caseTitle}"

Person A says: "${personAStatement}"
Person B says: "${personBStatement}"

List any contradictions. Be specific.
Format each as: "[What was claimed] vs [conflicting claim]"
If no contradictions, respond with: "No contradictions detected"`

  const fullUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`

  try {
    const response = await fetch(fullUrl, {
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (text.includes('No contradictions detected')) {
      return []
    }

    // Parse contradictions from response
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim())
  } catch (error) {
    console.error('Contradiction detection failed:', error)
    return []
  }
}
