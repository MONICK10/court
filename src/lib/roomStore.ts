export interface RoomPerson {
  name: string
  ready: boolean
  apiKeyConfirmed: boolean
  apiKey?: string
  statement?: string
}

export interface RoomMessage {
  speaker: string
  text: string
  timestamp: number
}

export interface RoomEvidence {
  uploadedBy: 'A' | 'B'
  description: string
  timestamp: number
}

export interface RoomCourtOrder {
  id: string
  description: string
  assignedTo: 'A' | 'B' | 'both'
  assignedName: string
  completed: boolean
}

export interface RoomCourtroomState {
  conversationHistory: RoomMessage[]
  currentPhase: string
  waitingFor: 'A' | 'B' | null
  waitingForEvidence: boolean
  evidenceRequester: 'A' | 'B' | null
  crossExamRound: number
  isProcessing: boolean
  contradictions: string[]
  evidence: RoomEvidence[]
  verdict?: {
    text: string
    winner: 'A' | 'B' | 'shared'
    winnerName: string
    loserName: string
  }
  courtOrders: RoomCourtOrder[]
  lastUpdated: number
}

export interface Room {
  code: string
  courtName: string
  password: string
  personA: RoomPerson
  personB?: RoomPerson
  pendingPersonB?: { name: string }
  status: 'waiting_for_B' | 'pending_approval' | 'waiting_ready' | 'api_keys' | 'filing' | 'in_court'
  mood?: string
  language?: string
  createdAt: number
  courtroomState?: RoomCourtroomState
}

declare global {
  // eslint-disable-next-line no-var
  var __roomStore: Map<string, Room> | undefined
}

function getStore(): Map<string, Room> {
  if (!global.__roomStore) {
    global.__roomStore = new Map()
  }
  return global.__roomStore
}

export function createRoom(courtName: string, password: string, personAName: string): Room {
  const code = generateCode()
  const room: Room = {
    code,
    courtName,
    password,
    personA: { name: personAName, ready: false, apiKeyConfirmed: false },
    status: 'waiting_for_B',
    createdAt: Date.now(),
  }
  getStore().set(code, room)
  return room
}

export function getRoom(code: string): Room | undefined {
  return getStore().get(code)
}

export function updateRoom(code: string, updates: Partial<Room>): Room | undefined {
  const room = getStore().get(code)
  if (!room) return undefined
  const updated = { ...room, ...updates }
  getStore().set(code, updated)
  return updated
}

export function getRoomSafe(code: string): Omit<Room, 'password'> | undefined {
  const room = getRoom(code)
  if (!room) return undefined
  const { password: _pw, ...safe } = room
  void _pw
  return safe
}

function generateCode(): string {
  const store = getStore()
  let code: string
  do {
    code = String(Math.floor(1000 + Math.random() * 9000))
  } while (store.has(code))
  return code
}
