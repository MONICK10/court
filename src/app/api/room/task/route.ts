import { NextRequest, NextResponse } from 'next/server'
import { getRoom, updateRoom } from '@/lib/roomStore'

export async function POST(request: NextRequest) {
  try {
    const { code, person, taskId } = await request.json()
    const room = getRoom(code)
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (!room.courtroomState) return NextResponse.json({ error: 'No courtroom state' }, { status: 400 })

    const cs = { ...room.courtroomState }
    const task = cs.courtOrders.find(o => o.id === taskId)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // Only the OTHER person (witness) can mark it done
    const canComplete =
      task.assignedTo === 'both' ||
      (task.assignedTo === 'A' && person === 'B') ||
      (task.assignedTo === 'B' && person === 'A')

    if (!canComplete) {
      return NextResponse.json(
        { error: 'Only the other person (the witness) can mark this done' },
        { status: 403 }
      )
    }

    cs.courtOrders = cs.courtOrders.map(o =>
      o.id === taskId ? { ...o, completed: true } : o
    )
    cs.lastUpdated = Date.now()
    updateRoom(code, { courtroomState: cs })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
