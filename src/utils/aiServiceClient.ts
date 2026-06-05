/**
 * AI Service Client
 * Auto-detects and routes between Ollama (dev) and Groq (prod)
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:8b'
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const AI_SERVICE = process.env.AI_SERVICE || 'ollama'

// ==========================================
// MOCK SERVICE (Fallback for testing)
// ==========================================

function getMockResponse(prompt: string): string {
  // Simple mock that generates relevant courtroom responses
  if (prompt.includes('lawyer') || prompt.includes('opening')) {
    const lawyers = [
      "My client is being unfairly blamed for something that was clearly a misunderstanding. The facts speak for themselves.",
      "The evidence clearly demonstrates that my client acted reasonably given the circumstances. We have witnesses.",
      "Your Honor, my client has been nothing but truthful and transparent throughout this entire situation."
    ]
    return lawyers[Math.floor(Math.random() * lawyers.length)]
  }

  if (prompt.includes('Judge') || prompt.includes('question')) {
    const questions = [
      "Let me ask you this: when exactly did you realize there was a problem?",
      "Can you walk me through the events that led to this conflict? Be specific.",
      "What would have happened if you had communicated differently from the start?"
    ]
    return questions[Math.floor(Math.random() * questions.length)]
  }

  if (prompt.includes('verdict') || prompt.includes('Verdict')) {
    return `VERDICT: After careful consideration of the facts and both parties' positions, I find the evidence compelling on both sides. There are clear contradictions that suggest both parties bear some responsibility. The winner of this case is: Shared Responsibility. Both of you need to work on communication. Court Orders: 1) Schedule a mediation session within one week, 2) Practice active listening before responding, 3) Have a proper conversation about expectations.`
  }

  // Default mock response
  const defaults = [
    "I understand your position, but let me point out something important...",
    "That's an interesting perspective, but the facts suggest otherwise.",
    "I hear what you're saying, and that's noted in the record."
  ]
  return defaults[Math.floor(Math.random() * defaults.length)]
}

// ==========================================
// OLLAMA CLIENT
// ==========================================

async function callOllama(prompt: string): Promise<string> {
  console.log('🦙 Calling Ollama:', OLLAMA_MODEL)

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        temperature: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Ollama error:', errorText)
      throw new Error(`Ollama error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.response) {
      throw new Error('No response from Ollama')
    }

    console.log('✅ Ollama response received')
    return data.response
  } catch (error) {
    console.error('❌ Ollama call failed:', error)
    throw error
  }
}

// ==========================================
// GROQ CLIENT
// ==========================================

async function callGroq(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || GROQ_API_KEY
  if (!key) {
    throw new Error('GROQ_API_KEY not configured')
  }

  console.log('⚡ Calling Groq:', GROQ_MODEL)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Groq error:', errorText)
      throw new Error(`Groq error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No response from Groq')
    }

    console.log('✅ Groq response received')
    return data.choices[0].message.content
  } catch (error) {
    console.error('❌ Groq call failed:', error)
    throw error
  }
}

export async function validateGroqKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 3,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

// ==========================================
// MAIN AI SERVICE CLIENT
// ==========================================

export async function callAI(prompt: string, apiKey?: string): Promise<string> {
  console.log(`📡 AI Service: ${apiKey ? 'groq(room-key)' : AI_SERVICE}`)

  // Room-specific key: always use Groq
  if (apiKey) {
    return callGroq(prompt, apiKey)
  }

  // Try primary service
  try {
    if (AI_SERVICE === 'groq') {
      return await callGroq(prompt)
    } else if (AI_SERVICE === 'ollama') {
      return await callOllama(prompt)
    } else {
      throw new Error(`Unknown AI service: ${AI_SERVICE}`)
    }
  } catch (error) {
    console.error('❌ Primary service failed, attempting fallback...')

    if (AI_SERVICE === 'groq') {
      console.log('🔄 Falling back to Ollama...')
      try {
        return await callOllama(prompt)
      } catch {
        console.log('🎭 Using mock response for testing')
        return getMockResponse(prompt)
      }
    } else {
      if (GROQ_API_KEY) {
        console.log('🔄 Falling back to Groq...')
        try {
          return await callGroq(prompt)
        } catch {
          console.log('🎭 Using mock response for testing')
          return getMockResponse(prompt)
        }
      } else {
        console.log('🎭 Using mock response for testing')
        return getMockResponse(prompt)
      }
    }
  }
}

// ==========================================
// DEBUG INFO
// ==========================================

export function getAIServiceStatus(): {
  primary: string
  fallback: string
  ollama: {
    url: string
    model: string
    available: boolean
  }
  groq: {
    model: string
    available: boolean
  }
} {
  return {
    primary: AI_SERVICE,
    fallback: AI_SERVICE === 'ollama' ? 'groq' : 'ollama',
    ollama: {
      url: OLLAMA_URL,
      model: OLLAMA_MODEL,
      available: !!OLLAMA_URL,
    },
    groq: {
      model: GROQ_MODEL,
      available: !!GROQ_API_KEY,
    },
  }
}
