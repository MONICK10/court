'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface UserInputPanelProps {
  personName: string
  onSubmit: (input: string) => void
  isLoading: boolean
}

export default function UserInputPanel({
  personName,
  onSubmit,
  isLoading,
}: UserInputPanelProps) {
  const [showInput, setShowInput] = useState(false)
  const [inputText, setInputText] = useState('')

  const handleSubmit = async () => {
    if (!inputText.trim()) return
    onSubmit(inputText.trim())
    setInputText('')
    setShowInput(false)
  }

  if (showInput) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pt-8 pb-8 px-4 z-50"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-lg font-bold text-accent-gold text-center">
            {personName} — Your Response?
          </h3>
          <p className="text-sm text-gray-400 text-center">
            The court awaits your clarification.
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Provide your statement, defense, or clarification..."
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none resize-none"
            rows={4}
            disabled={isLoading}
          />

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowInput(false)}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isLoading}
              className="px-6 py-2 rounded-lg bg-accent-red hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Statement'}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pt-8 pb-8 px-4 z-50"
    >
      <div className="max-w-2xl mx-auto">
        <motion.button
          onClick={() => setShowInput(true)}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full px-8 py-4 rounded-lg bg-gradient-to-r from-accent-red to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-accent-red/50"
        >
          <span className="text-2xl mr-2">🗣️</span>
          Judge Awaits Your Response
        </motion.button>

        {isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 text-sm mt-3"
          >
            Processing response...
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
