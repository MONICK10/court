'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import CourtroomLayout from '@/components/CourtroomLayout'

export default function KeysPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [myPerson, setMyPerson] = useState<'A' | 'B' | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'confirmed' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const poll = useCallback(async () => {
    const res = await fetch(`/api/room/status?code=${code}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.status === 'filing') {
      router.push(`/room/${code}/file`)
    }
  }, [code, router])

  useEffect(() => {
    const person = sessionStorage.getItem('roomPerson') as 'A' | 'B'
    setMyPerson(person)
  }, [])

  useEffect(() => {
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [poll])

  const handleConfirm = async () => {
    if (!apiKey.trim() || !myPerson) return
    setStatus('testing')
    setErrorMsg('')
    try {
      const res = await fetch('/api/room/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, person: myPerson, apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Invalid API key — double-check and try again')
      } else {
        setStatus('confirmed')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error')
    }
  }

  return (
    <CourtroomLayout>
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-accent-gold">API Key Setup</h1>
          <p className="text-gray-400 text-sm mt-1">
            Only <span className="text-white font-semibold">one person</span> needs to paste a key — it powers the judge for both of you
          </p>
        </motion.div>

        {/* Guide */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full dark-glass border border-white/10 rounded-lg p-5 space-y-2 text-sm text-gray-300"
        >
          <p className="font-semibold text-white mb-3">How to get a free Groq API key:</p>
          {[
            { num: '1.', text: 'Go to ', link: 'console.groq.com', href: 'https://console.groq.com' },
            { num: '2.', text: 'Sign up for a free account', link: null, href: null },
            { num: '3.', text: 'Click "API Keys" → "Create API Key"', link: null, href: null },
            { num: '4.', text: 'Copy and paste it below', link: null, href: null },
          ].map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-accent-gold font-bold">{item.num}</span>
              <span>
                {item.text}
                {item.link && item.href && (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-accent-gold underline">{item.link}</a>
                )}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Input or confirmed */}
        {status !== 'confirmed' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-3"
          >
            <input
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              className="w-full bg-gray-800 border border-gray-600 focus:border-accent-gold text-white px-4 py-3 rounded-lg focus:outline-none transition font-mono text-sm"
              autoFocus
            />
            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
            <button
              onClick={handleConfirm}
              disabled={!apiKey.trim() || status === 'testing'}
              className="w-full bg-accent-gold hover:bg-accent-gold/80 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
            >
              {status === 'testing' ? 'Testing key...' : 'Confirm API Key'}
            </button>
            <p className="text-center text-xs text-gray-500">
              If the other person already pasted their key, just wait &mdash; you&apos;ll be redirected automatically.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center space-y-3"
          >
            <p className="text-green-400 font-bold text-lg">✓ API Key confirmed!</p>
            <p className="text-accent-gold text-sm animate-pulse">Proceeding to case filing...</p>
          </motion.div>
        )}
      </div>
    </CourtroomLayout>
  )
}
