import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom } from '@/lib/roomStore'

export async function POST(request: NextRequest) {
  try {
    const { code, personBName, password } = await request.json()
    if (!code || !personBName || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.password !== password) return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    if (room.status !== 'waiting_for_B') {
      return NextResponse.json({ error: 'Room is not accepting new members' }, { status: 409 })
    }

    updateRoom(code, {
      pendingPersonB: { name: personBName.trim() },
      status: 'pending_approval',
    })

    return NextResponse.json({ success: true, courtName: room.courtName, personAName: room.personA.name })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
