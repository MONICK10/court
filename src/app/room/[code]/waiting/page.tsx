'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import CourtroomLayout from '@/components/CourtroomLayout'

interface RoomStatus {
  code: string
  courtName: string
  status: string
  personA: { name: string; ready: boolean }
  personB: { name: string; ready: boolean } | null
  pendingPersonB: { name: string } | null
}

export default function WaitingPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [room, setRoom] = useState<RoomStatus | null>(null)
  const [myPerson, setMyPerson] = useState<'A' | 'B' | null>(null)
  const [readyClicked, setReadyClicked] = useState(false)
  const [error, setError] = useState('')

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/status?code=${code}`)
      if (!res.ok) { setError('Room not found'); return }
      const data: RoomStatus = await res.json()
      setRoom(data)

      if (data.status === 'api_keys') {
        router.push(`/room/${code}/keys`)
      }
    } catch {
      setError('Connection error')
    }
  }, [code, router])

  useEffect(() => {
    const person = sessionStorage.getItem('roomPerson') as 'A' | 'B' | null
    setMyPerson(person)
    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [poll])

  const handleAccept = async (accept: boolean) => {
    await fetch('/api/room/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, accept }),
    })
    poll()
  }

  const handleReady = async () => {
    setReadyClicked(true)
    await fetch('/api/room/ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, person: myPerson }),
    })
    poll()
  }

  if (error) return (
    <CourtroomLayout>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-xl">{error}</p>
      </div>
    </CourtroomLayout>
  )

  if (!room) return (
    <CourtroomLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent-gold text-xl animate-pulse">Loading...</div>
      </div>
    </CourtroomLayout>
  )

  const myReady = myPerson === 'A' ? room.personA.ready : room.personB?.ready
  const otherReady = myPerson === 'A' ? room.personB?.ready : room.personA.ready
  const otherName = myPerson === 'A' ? room.personB?.name : room.personA.name

  return (
    <CourtroomLayout>
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-3xl font-bold text-accent-gold">{room.courtName}</h1>
          <p className="text-gray-400 mt-1">Room Code: <span className="text-white font-bold text-2xl tracking-widest">{code}</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-4"
        >
          {/* Person A waiting for B */}
          {myPerson === 'A' && room.status === 'waiting_for_B' && (
            <div className="dark-glass border border-white/10 rounded-lg p-6 text-center">
              <p className="text-gray-300 mb-2">Share this code with the other person:</p>
              <p className="text-4xl font-bold text-accent-gold tracking-widest">{code}</p>
              <p className="text-gray-400 text-sm mt-3 animate-pulse">Waiting for them to join...</p>
            </div>
          )}

          {/* Person A — approve pending B */}
          {myPerson === 'A' && room.status === 'pending_approval' && room.pendingPersonB && (
            <div className="dark-glass border border-accent-gold/30 rounded-lg p-6">
              <p className="text-center text-white mb-4">
                <span className="text-accent-gold font-bold">{room.pendingPersonB.name}</span> wants to join
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAccept(true)}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAccept(false)}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Person B — waiting for approval */}
          {myPerson === 'B' && (room.status === 'pending_approval' || room.status === 'waiting_for_B') && (
            <div className="dark-glass border border-white/10 rounded-lg p-6 text-center">
              <p className="text-gray-300 animate-pulse">Waiting for {room.personA.name} to accept you...</p>
            </div>
          )}

          {/* Both in room — ready up */}
          {room.status === 'waiting_ready' && (
            <div className="dark-glass border border-white/10 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-accent-gold text-center">Both connected!</h2>
              <div className="flex justify-between text-sm">
                <span className={`px-3 py-1 rounded-full ${room.personA.ready ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                  {room.personA.name} {room.personA.ready ? '✓ Ready' : '...'}
                </span>
                {room.personB && (
                  <span className={`px-3 py-1 rounded-full ${room.personB.ready ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                    {room.personB.name} {room.personB.ready ? '✓ Ready' : '...'}
                  </span>
                )}
              </div>
              {!myReady && (
                <button
                  onClick={handleReady}
                  disabled={readyClicked}
                  className="w-full bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
                >
                  I&apos;m Ready
                </button>
              )}
              {myReady && !otherReady && (
                <p className="text-center text-gray-400 text-sm animate-pulse">
                  Waiting for {otherName} to ready up...
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </CourtroomLayout>
  )
}
