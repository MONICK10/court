/**
 * GEMINI AI SERVICE
 * Generates contextual courtroom responses using Google's Generative AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { CourtroomMemoryState, getMemorySummary } from './courtroomMemory'
import { CourtMood } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface GenerateMessageParams {
  speaker: 'judge' | 'lawyerA' | 'lawyerB'
  phase: string
  memory: CourtroomMemoryState
  mood: CourtMood
  action: string
}

/**
 * Generate a contextual courtroom message using Gemini
 */
export async function generateCourtMessage(params: GenerateMessageParams): Promise<string> {
  const { speaker, phase, memory, mood, action } = params

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Build context for the prompt
  const memorySummary = getMemorySummary(memory)
  const recentMessages = memory.conversationHistory.slice(-3).map(m => `${m.speaker}: ${m.message}`).join('\n')

  const speakerRole = speaker === 'judge' ? 'a sharp, observant judge'
    : speaker === 'lawyerA' ? `${memory.caseSetup.personAName}'s passionate, emotional lawyer`
    : `${memory.caseSetup.personBName}'s logical, analytical lawyer`

  const prompt = `You are ${speakerRole} in an AI relationship courtroom drama. This is a witty, cinematic experience.

CASE CONTEXT:
- Title: ${memory.caseSetup.title}
- ${memory.caseSetup.personAName}'s argument: ${memory.caseSetup.personAArgument}
- ${memory.caseSetup.personBName}'s argument: ${memory.caseSetup.personBArgument}
- Mood: ${mood}
- Current phase: ${phase}
- Action: ${action}

MEMORY STATE:
${memorySummary}

RECENT EXCHANGE:
${recentMessages || 'No messages yet'}

TASK: Generate a brief, dramatic courtroom response (1-2 sentences max) for the ${speaker}. 
- Keep it witty and cinematic, not robotic
- Reference case details when relevant
- Match the ${mood} tone
- For action "${action}", focus on ${getActionGuidance(action)}

Response should be natural dialogue, not narration. Just the spoken words.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return text.trim()
  } catch (error) {
    console.error('Gemini API error:', error)
    // Fallback to mock response if API fails
    return getFallbackMessage(speaker, phase, memory)
  }
}

/**
 * Get guidance for specific orchestrator actions
 */
function getActionGuidance(action: string): string {
  const guidance: Record<string, string> = {
    next_speaker: 'building on the argument with new points',
    ask_clarification: 'questioning for clarity and contradiction',
    challenge_contradiction: 'pointing out inconsistencies',
    reveal_emotional_layer: 'diving into emotional impact',
    request_user_input: 'asking for user participation',
    advance_phase: 'summarizing and moving to next phase',
    deliver_verdict: 'rendering a dramatic verdict',
  }
  return guidance[action] || 'advancing the conversation'
}

/**
 * Fallback message if API fails
 */
function getFallbackMessage(
  speaker: 'judge' | 'lawyerA' | 'lawyerB',
  phase: string,
  memory: CourtroomMemoryState
): string {
  const templates: Record<string, Record<string, string[]>> = {
    judge: {
      opening_statements: [
        'This court finds the allegations intriguing. Let\'s proceed.',
        'The bench requires clarity on these points.',
        'Interesting. And what evidence supports this?',
      ],
      lawyer_reframing: [
        'Objection overruled. Continue.',
        'The court notes the reframing. Proceed.',
        'Elaborate on this context.',
      ],
      cross_examination: [
        'A contradiction has been noted.',
        'The bench observes inconsistency here.',
        'Can you reconcile these statements?',
      ],
      emotional_clarification: [
        'The emotional impact is clear.',
        'This court recognizes the pain involved.',
        'Let\'s explore the emotional dimension.',
      ],
      final_arguments: [
        'The case is becoming clear.',
        'The bench will now render judgment.',
        'Your final statements?',
      ],
      verdict: [
        'After careful consideration... the court rules.',
        'Justice requires this verdict.',
        'Let the record show...',
      ],
    },
    lawyerA: {
      opening_statements: [
        `Your honor, I represent ${memory.caseSetup.personAName}. The facts are clear.`,
        `My client has been patient, but the truth must be heard.`,
        `The evidence will show...`,
      ],
      lawyer_reframing: [
        'What my client means to convey is...',
        'Let me provide the context here...',
        'The situation is more nuanced than portrayed...',
      ],
      cross_examination: [
        'That contradicts your earlier statement.',
        'But earlier you said...',
        'How do you explain this inconsistency?',
      ],
      verdict: [
        'The evidence is overwhelming.',
        'This is about fairness.',
      ],
    },
    lawyerB: {
      opening_statements: [
        `Your honor, I represent ${memory.caseSetup.personBName}. Let me present the facts.`,
        `The narrative presented is incomplete.`,
        `The record will demonstrate...`,
      ],
      lawyer_reframing: [
        'With respect, the reality is different.',
        'The context changes everything.',
        'Allow me to clarify...',
      ],
      cross_examination: [
        'That\'s a selective interpretation.',
        'The facts don\'t support that conclusion.',
        'But you also said...',
      ],
      verdict: [
        'The logic is undeniable.',
        'The truth is on record.',
      ],
    },
  }

  const options = templates[speaker][phase] || templates[speaker].opening_statements
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Check if API key is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY
}
