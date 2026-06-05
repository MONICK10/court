/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import CourtroomLayout from '@/components/CourtroomLayout'
import { CaseSetup, CourtMood, Language } from '@/types'
import { useRouter } from 'next/navigation'

const moodOptions: { value: CourtMood; label: string; emoji: string }[] = [
  { value: 'savage', label: 'Savage', emoji: '🔥' },
  { value: 'funny', label: 'Funny', emoji: '😂' },
  { value: 'serious', label: 'Serious', emoji: '🎓' },
  { value: 'drama', label: 'Cinema Drama', emoji: '🎬' },
]

export default function SetupPage() {
  const router = useRouter()

  // Guard: must have logged in via /solo-login first
  useEffect(() => {
    if (sessionStorage.getItem('solo_auth') !== '1') {
      router.replace('/solo-login')
    }
  }, [router])

  const [formData, setFormData] = useState<CaseSetup>({
    title: '',
    personAName: '',
    personAArgument: '',
    personBName: '',
    personBArgument: '',
    mood: 'funny',
    language: 'english',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Case title is required'
    if (!formData.personAName.trim()) newErrors.personAName = 'Person A name is required'
    if (!formData.personAArgument.trim()) newErrors.personAArgument = 'Person A argument is required'
    if (!formData.personBName.trim()) newErrors.personBName = 'Person B name is required'
    if (!formData.personBArgument.trim()) newErrors.personBArgument = 'Person B argument is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Store case data in session storage for the courtroom page
      sessionStorage.setItem('caseSetup', JSON.stringify(formData))
      router.push('/courtroom')
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <CourtroomLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen flex items-center justify-center py-8"
      >
        <div className="w-full max-w-2xl">
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-4xl font-bold text-accent-gold mb-2">Case Setup</h1>
            <p className="text-gray-400">Prepare your case for court</p>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-6 dark-glass p-8 rounded-xl border border-white/10"
          >
            {/* Case Title */}
            <div>
              <label className="block text-sm font-semibold text-accent-gold mb-2">
                📋 Case Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., The Case of Forgotten Anniversaries"
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none transition-all"
              />
              {errors.title && (
                <p className="text-accent-red text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Person A */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-accent-gold mb-2">
                  👤 Person A Name
                </label>
                <input
                  type="text"
                  name="personAName"
                  value={formData.personAName}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none transition-all"
                />
                {errors.personAName && (
                  <p className="text-accent-red text-sm mt-1">{errors.personAName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-accent-red mb-2">
                  👤 Person B Name
                </label>
                <input
                  type="text"
                  name="personBName"
                  value={formData.personBName}
                  onChange={handleInputChange}
                  placeholder="Their name"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-accent-red focus:outline-none transition-all"
                />
                {errors.personBName && (
                  <p className="text-accent-red text-sm mt-1">{errors.personBName}</p>
                )}
              </div>
            </div>

            {/* Arguments */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-accent-gold mb-2">
                  💬 {formData.personAName || 'Person A'}'s Argument
                </label>
                <textarea
                  name="personAArgument"
                  value={formData.personAArgument}
                  onChange={handleInputChange}
                  placeholder="State your case..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none transition-all resize-none"
                />
                {errors.personAArgument && (
                  <p className="text-accent-red text-sm mt-1">{errors.personAArgument}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-accent-red mb-2">
                  💬 {formData.personBName || 'Person B'}'s Argument
                </label>
                <textarea
                  name="personBArgument"
                  value={formData.personBArgument}
                  onChange={handleInputChange}
                  placeholder="Counter-argument..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-accent-red focus:outline-none transition-all resize-none"
                />
                {errors.personBArgument && (
                  <p className="text-accent-red text-sm mt-1">{errors.personBArgument}</p>
                )}
              </div>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-semibold text-accent-gold mb-3">
                🎭 Select Court Mood
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moodOptions.map((mood) => (
                  <motion.button
                    key={mood.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, mood: mood.value }))
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all border-2 ${
                      formData.mood === mood.value
                        ? 'border-accent-gold bg-accent-gold/20 text-accent-gold'
                        : 'border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-xs">{mood.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-semibold text-accent-gold mb-3">
                🌐 Court Language
              </label>
              <div className="flex gap-3">
                {([
                  { value: 'english', label: 'English', sub: 'Default' },
                  { value: 'tamil',   label: 'தமிழ் Tamil', sub: 'Type in Tamil or Tanglish' },
                ] as { value: Language; label: string; sub: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, language: opt.value }))}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-left transition-all ${
                      formData.language === opt.value
                        ? 'border-accent-gold bg-accent-gold/20 text-white'
                        : 'border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs opacity-60 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              variants={itemVariants}
              className="flex gap-4 pt-4"
            >
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-accent-gold to-accent-red text-black font-bold rounded-lg hover:shadow-glow-gold transition-all text-lg"
              >
                ⚖️ Go to Court
              </motion.button>
              <Link href="/" className="flex-1">
                <button
                  type="button"
                  className="w-full py-4 px-6 border-2 border-accent-gold/50 text-accent-gold font-bold rounded-lg hover:bg-accent-gold/10 transition-all"
                >
                  ← Back
                </button>
              </Link>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </CourtroomLayout>
  )
}
