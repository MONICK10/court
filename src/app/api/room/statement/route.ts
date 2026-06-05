import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom } from '@/lib/roomStore'

export async function POST(request: NextRequest) {
  try {
    const { code, person, statement, mood } = await request.json()
    if (!code || !person || !statement) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    if (person === 'A') {
      updateRoom(code, {
        personA: { ...room.personA, statement: statement.trim() },
        ...(mood ? { mood } : {}),
        ...(body.language ? { language: body.language } : {}),
      })
    } else if (person === 'B' && room.personB) {
      updateRoom(code, { personB: { ...room.personB, statement: statement.trim() } })
    }

    const updated = getRoom(code)!
    if (updated.personA.statement && updated.personB?.statement) {
      updateRoom(code, { status: 'in_court' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
