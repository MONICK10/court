import { NextRequest } from 'next/server'
import { WebSocket } from 'ws'
import { randomUUID } from 'crypto'

// ─── Edge TTS config ────────────────────────────────────────────────
const EDGE_WS_URL =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1' +
  '?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4'

const VOICE   = 'en-GB-ThomasNeural'
const RATE    = '-20%'
const PITCH   = '-10%'

// ─── Helpers ────────────────────────────────────────────────────────

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function timestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace('Z', 'Z')
}

function buildSsml(text: string) {
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' ` +
    `xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-GB'>` +
    `<voice name='${VOICE}'>` +
    `<prosody rate='${RATE}' pitch='${PITCH}'>${escapeXml(text)}</prosody>` +
    `</voice></speak>`
  )
}

// ─── Core: call Edge TTS and return MP3 buffer ──────────────────────

function edgeTTS(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const connId = randomUUID().replace(/-/g, '').toUpperCase()
    const ws = new WebSocket(`${EDGE_WS_URL}&ConnectionId=${connId}`, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      },
    })

    const chunks: Buffer[] = []
    let audioStarted = false

    const AUDIO_BOUNDARY = Buffer.from('Path:audio\r\n')

    ws.on('open', () => {
      // 1. Speech config
      ws.send(
        `X-Timestamp:${timestamp()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
                outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
              },
            },
          },
        })
      )

      // 2. SSML turn
      const ssml = buildSsml(text)
      ws.send(
        `X-RequestId:${connId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${timestamp()}\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml
      )
    })

    ws.on('message', (data: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        // Text frame — check for turn.end
        const text = data.toString()
        if (text.includes('Path:turn.end')) {
          ws.close()
          resolve(Buffer.concat(chunks))
        }
        return
      }

      // Binary frame — find where audio data starts after the header
      const idx = data.indexOf(AUDIO_BOUNDARY)
      if (idx !== -1) {
        audioStarted = true
        chunks.push(data.subarray(idx + AUDIO_BOUNDARY.length))
      } else if (audioStarted) {
        chunks.push(data)
      }
    })

    ws.on('error', (err) => reject(err))

    ws.on('close', () => {
      if (chunks.length > 0) resolve(Buffer.concat(chunks))
      else reject(new Error('Edge TTS: connection closed with no audio'))
    })

    // Safety timeout — 15 s
    setTimeout(() => {
      ws.terminate()
      reject(new Error('Edge TTS: timeout'))
    }, 15_000)
  })
}

// ─── API route ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { text, apiKey: bodyKey } = await request.json()
    if (!text?.trim()) return Response.json({ error: 'No text' }, { status: 400 })

    // 1. Try Edge TTS (en-GB-ThomasNeural, -20% rate, -10% pitch) — free, no key
    try {
      const mp3 = await edgeTTS(text.trim())
      return new Response(mp3, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(mp3.length),
          'Cache-Control': 'no-store',
          'X-TTS-Provider': 'edge',
        },
      })
    } catch (edgeErr) {
      console.warn('⚠️ Edge TTS failed, trying Groq fallback:', edgeErr)
    }

    // 2. Fallback: Groq TTS (requires user's API key)
    const apiKey = bodyKey || process.env.GROQ_API_KEY
    if (!apiKey) return Response.json({ error: 'TTS unavailable' }, { status: 503 })

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'playai-tts', input: text, voice: 'Alistair-PlayAI', response_format: 'mp3' }),
    })
    if (!groqRes.ok) return Response.json({ error: 'All TTS providers failed' }, { status: 503 })

    const buf = await groqRes.arrayBuffer()
    return new Response(buf, {
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(buf.byteLength), 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
