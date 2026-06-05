'use client'

import { useCallback, useRef, useEffect } from 'react'
import type { AnimState } from '@/components/JudgeScene'

interface SpeakOptions {
  onStart?: () => void
  onEnd?: () => void
  apiKey?: string
  voice?: string
  /** 'tamil' uses browser Tamil TTS (ta-IN) instead of Groq which is English-only */
  language?: 'english' | 'tamil'
}

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const speak = useCallback(async (text: string, opts: SpeakOptions = {}) => {
    if (!text.trim()) return

    // Stop anything currently playing
    stopAudio()

    const { onStart, onEnd, apiKey, voice = 'Alistair-PlayAI', language } = opts

    // Tamil: browser TTS (separate path)
    if (language === 'tamil') {
      tamilSpeak(text, onStart, onEnd)
      return
    }

    // Edge TTS (Thomas Neural) → Groq fallback — both handled server-side
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, apiKey }),
      })

      if (!res.ok) {
        console.warn('⚠️ Groq TTS unavailable, falling back to browser voice')
        fallbackSpeak(text, onStart, onEnd)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => onStart?.()
      audio.onended = () => {
        URL.revokeObjectURL(url)
        objectUrlRef.current = null
        audioRef.current = null
        onEnd?.()
      }
      audio.onerror = () => {
        console.warn('⚠️ Audio playback error, falling back to browser voice')
        fallbackSpeak(text, onStart, onEnd)
        onEnd?.()
      }

      await audio.play()
    } catch (err) {
      console.warn('⚠️ TTS error, falling back to browser voice:', err)
      fallbackSpeak(text, onStart, onEnd)
    }
  }, [])

  const stop = useCallback(() => {
    stopAudio()
    // Also cancel any fallback browser speech
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel()
    }
  }, [])

  return { speak, stop }
}

/** Browser Web Speech API fallback (robotic but always works) */
function fallbackSpeak(text: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === 'undefined') return
  window.speechSynthesis?.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.82
  utterance.pitch = 0.85
  utterance.volume = 1
  if (onStart) utterance.onstart = onStart
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis?.speak(utterance)
}

/** Tamil TTS — uses browser ta-IN voice if installed, otherwise captions-only */
function tamilSpeak(text: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === 'undefined') return
  window.speechSynthesis?.cancel()

  const doSpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const tamilVoice = voices.find(v => v.lang.startsWith('ta')) ?? null

    if (!tamilVoice) {
      // No Tamil voice installed — show caption silently, call callbacks so animation still works
      onStart?.()
      const wordCount = text.split(/\s+/).length
      const duration = Math.max(2000, wordCount * 300)
      setTimeout(() => onEnd?.(), duration)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ta-IN'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.voice = tamilVoice
    if (onStart) utterance.onstart = onStart
    if (onEnd) utterance.onend = onEnd
    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak()
  } else {
    window.speechSynthesis.onvoiceschanged = () => { doSpeak() }
  }
}

/** Map a courtroom phase + context to an animation state */
export function phaseToAnimState(phase: string, isJudgeSpeaking: boolean): AnimState {
  if (!isJudgeSpeaking) return 'idle'
  if (phase === 'verdict') return 'verdict'
  if (phase === 'investigation' || phase === 'crossExamination') return 'arguing'
  return 'talking'
}
