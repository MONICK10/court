'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SoloLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username === 'admin' && password === 'volume3') {
      sessionStorage.setItem('solo_auth', '1')
      router.push('/setup')
    } else {
      setError('Invalid username or password')
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)' }}
    >
      <motion.div
        animate={shaking ? { x: [-12, 12, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-4"
      >
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-2xl font-bold" style={{ color: '#c0a060' }}>Solo Court</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to access the solo courtroom</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-8 space-y-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(192,160,96,0.2)',
          }}
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(192,160,96,0.3)',
              }}
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(192,160,96,0.3)',
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-opacity hover:opacity-90"
            style={{ background: '#c0a060', color: '#0a0a0f' }}
          >
            Enter Courtroom
          </button>
        </form>
      </motion.div>
    </div>
  )
}
