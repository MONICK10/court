import { NextRequest, NextResponse } from 'next/server'
import { getRoomSafe } from '@/lib/roomStore'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const room = getRoomSafe(code)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  return NextResponse.json({
    code: room.code,
    courtName: room.courtName,
    status: room.status,
    personA: { name: room.personA.name, ready: room.personA.ready, apiKeyConfirmed: room.personA.apiKeyConfirmed },
    personB: room.personB
      ? { name: room.personB.name, ready: room.personB.ready, apiKeyConfirmed: room.personB.apiKeyConfirmed }
      : null,
    pendingPersonB: room.pendingPersonB ?? null,
    mood: room.mood ?? null,
  })
}
