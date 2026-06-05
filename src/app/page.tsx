/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import CourtroomLayout from '@/components/CourtroomLayout'

type View = 'home' | 'create' | 'join'

export default function Home() {
  const router = useRouter()
  const [view, setView] = useState<View>('home')

  // Create form
  const [courtName, setCourtName] = useState('')
  const [personAName, setPersonAName] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Join form
  const [joinCode, setJoinCode] = useState('')
  const [personBName, setPersonBName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleCreate = async () => {
    if (!courtName.trim() || !personAName.trim() || !password.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtName: courtName.trim(), personAName: personAName.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error); return }
      sessionStorage.setItem('roomPerson', 'A')
      sessionStorage.setItem('roomCode', data.code)
      sessionStorage.setItem('roomPersonName', personAName.trim())
      router.push(`/room/${data.code}/waiting`)
    } catch {
      setCreateError('Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !personBName.trim() || !joinPassword.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim(), personBName: personBName.trim(), password: joinPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error); return }
      sessionStorage.setItem('roomPerson', 'B')
      sessionStorage.setItem('roomCode', joinCode.trim())
      sessionStorage.setItem('roomPersonName', personBName.trim())
      router.push(`/room/${joinCode.trim()}/waiting`)
    } catch {
      setJoinError('Failed to join room')
    } finally {
      setJoining(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  }

  return (
    <CourtroomLayout>
      <AnimatePresence mode="wait">

        {/* HOME VIEW */}
        {view === 'home' && (
          <motion.div
            key="home"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              variants={itemVariants}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl md:text-8xl"
            >
              ⚖️
            </motion.div>

            <motion.div variants={itemVariants} className="text-center max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-accent-gold to-accent-red bg-clip-text text-transparent">
                AI Relationship Court
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 italic">
                Where arguments go to die... or get a second chance.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 mt-4">
              <button
                onClick={() => setView('create')}
                className="px-10 py-4 text-lg font-bold text-black bg-gradient-to-r from-accent-gold to-accent-red rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Create Courtroom
              </button>
              <button
                onClick={() => setView('join')}
                className="px-10 py-4 text-lg font-bold text-accent-gold border-2 border-accent-gold rounded-lg hover:bg-accent-gold/10 transition-all duration-300"
              >
                Join Courtroom
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 mt-8 w-full max-w-3xl">
              {[
                { icon: '🎭', title: 'Dramatic', desc: 'Netflix courtroom vibes' },
                { icon: '😂', title: 'Witty', desc: 'Meme-worthy dialogue' },
                { icon: '⚡', title: 'Quick', desc: 'Instant verdicts' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="dark-glass p-6 rounded-lg text-center border border-white/10 hover:border-accent-gold/50 transition-all"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-6 text-sm text-gray-500">
              <a href="/home" className="hover:text-accent-gold transition">📊 History & Tasks</a>
              <a href="/setup" className="hover:text-accent-gold transition">⚡ Quick Solo Case</a>
            </motion.div>

            <motion.p variants={itemVariants} className="text-xs text-gray-600 text-center max-w-xl">
              For entertainment only. Do not base relationship decisions on AI judge verdicts.
            </motion.p>
          </motion.div>
        )}

        {/* CREATE VIEW */}
        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="min-h-screen flex flex-col items-center justify-center px-4"
          >
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <button onClick={() => setView('home')} className="text-gray-500 hover:text-gray-300 text-sm mb-4 transition">← Back</button>
                <div className="text-4xl mb-2">🏛️</div>
                <h2 className="text-2xl font-bold text-accent-gold">Create Courtroom</h2>
                <p className="text-gray-400 text-sm mt-1">You'll get a 4-digit code to share</p>
              </div>

              <div className="dark-glass border border-white/10 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Court name</label>
                  <input
                    type="text" placeholder="e.g. The Birthday Incident"
                    value={courtName} onChange={e => setCourtName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Your name</label>
                  <input
                    type="text" placeholder="Your name"
                    value={personAName} onChange={e => setPersonAName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Room password</label>
                  <input
                    type="password" placeholder="Set a password for the room"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition"
                  />
                </div>
                {createError && <p className="text-red-400 text-sm">{createError}</p>}
                <button
                  onClick={handleCreate}
                  disabled={!courtName.trim() || !personAName.trim() || !password.trim() || creating}
                  className="w-full bg-gradient-to-r from-accent-gold to-accent-red hover:opacity-90 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
                >
                  {creating ? 'Creating...' : 'Create & Get Code'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* JOIN VIEW */}
        {view === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="min-h-screen flex flex-col items-center justify-center px-4"
          >
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <button onClick={() => setView('home')} className="text-gray-500 hover:text-gray-300 text-sm mb-4 transition">← Back</button>
                <div className="text-4xl mb-2">🚪</div>
                <h2 className="text-2xl font-bold text-accent-gold">Join Courtroom</h2>
                <p className="text-gray-400 text-sm mt-1">Enter the code shared by the other person</p>
              </div>

              <div className="dark-glass border border-white/10 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">4-digit room code</label>
                  <input
                    type="text" placeholder="e.g. 4821" maxLength={4}
                    value={joinCode} onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition text-center text-2xl tracking-widest font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Your name</label>
                  <input
                    type="text" placeholder="Your name"
                    value={personBName} onChange={e => setPersonBName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Room password</label>
                  <input
                    type="password" placeholder="Password given by the other person"
                    value={joinPassword} onChange={e => setJoinPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-2 rounded focus:outline-none transition"
                  />
                </div>
                {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length !== 4 || !personBName.trim() || !joinPassword.trim() || joining}
                  className="w-full bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
                >
                  {joining ? 'Joining...' : 'Send Join Request'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </CourtroomLayout>
  )
}
