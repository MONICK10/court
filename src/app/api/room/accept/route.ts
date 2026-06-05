import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom } from '@/lib/roomStore'

export async function POST(request: NextRequest) {
  try {
    const { code, accept } = await request.json()
    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (!room.pendingPersonB) return NextResponse.json({ error: 'No pending person' }, { status: 400 })

    if (accept) {
      updateRoom(code, {
        personB: { name: room.pendingPersonB.name, ready: false, apiKeyConfirmed: false },
        pendingPersonB: undefined,
        status: 'waiting_ready',
      })
    } else {
      updateRoom(code, {
        pendingPersonB: undefined,
        status: 'waiting_for_B',
      })
    }

    return NextResponse.json({ success: true, accepted: accept })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
