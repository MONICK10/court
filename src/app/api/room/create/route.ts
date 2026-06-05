import { NextRequest, NextResponse } from 'next/server'
import { createRoom } from '@/lib/roomStore'

export async function POST(request: NextRequest) {
  try {
    const { courtName, personAName, password } = await request.json()
    if (!courtName || !personAName || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const room = createRoom(courtName.trim(), password, personAName.trim())
    return NextResponse.json({ code: room.code, courtName: room.courtName })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
