import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom } from '@/lib/roomStore'
import { validateGroqKey } from '@/utils/aiServiceClient'

export async function POST(request: NextRequest) {
  try {
    const { code, person, apiKey } = await request.json()
    if (!code || !person || !apiKey) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const valid = await validateGroqKey(apiKey)
    if (!valid) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    if (person === 'A') {
      updateRoom(code, { personA: { ...room.personA, apiKey, apiKeyConfirmed: true } })
    } else if (person === 'B' && room.personB) {
      updateRoom(code, { personB: { ...room.personB, apiKey, apiKeyConfirmed: true } })
    }

    const updated = getRoom(code)!
    if (updated.personA.apiKeyConfirmed || updated.personB?.apiKeyConfirmed) {
      updateRoom(code, { status: 'filing' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
