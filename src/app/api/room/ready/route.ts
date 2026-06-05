import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom } from '@/lib/roomStore'

export async function POST(request: NextRequest) {
  try {
    const { code, person } = await request.json()
    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    if (person === 'A') {
      updateRoom(code, { personA: { ...room.personA, ready: true } })
    } else if (person === 'B' && room.personB) {
      updateRoom(code, { personB: { ...room.personB, ready: true } })
    }

    const updated = getRoom(code)!
    if (updated.personA.ready && updated.personB?.ready) {
      updateRoom(code, { status: 'api_keys' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
