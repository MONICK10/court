'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CourtroomLayout from '@/components/CourtroomLayout'
import { motion, AnimatePresence } from 'framer-motion'

interface StoredCase {
  id: string
  title: string
  winner: string
  date: number
  mode: string
  personAName: string
  personBName: string
  verdictSummary: string
  courtOrders: Array<{
    id: string
    description: string
    assignedTo: string
    completed: boolean
  }>
}

export default function HomePage() {
  const router = useRouter()
  const [cases, setCases] = useState<StoredCase[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCases: 0,
    personAWins: 0,
    personBWins: 0,
    sharedResponsibility: 0,
  })
  const [selectedTab, setSelectedTab] = useState<'overview' | 'cases' | 'tasks'>('overview')

  // Load cases from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('courtroomCases')
    if (stored) {
      const caseList = JSON.parse(stored)
      setCases(caseList)

      // Calculate stats
      let aWins = 0
      let bWins = 0
      let shared = 0
      let allTasks: any[] = []

      caseList.forEach((c: StoredCase) => {
        if (c.winner === 'personAFavored') aWins++
        else if (c.winner === 'personBFavored') bWins++
        else if (c.winner === 'sharedResponsibility') shared++

        if (c.courtOrders) {
          c.courtOrders.forEach((order) => {
            if (!order.completed) {
              allTasks.push({
                ...order,
                caseTitle: c.title,
                caseId: c.id,
              })
            }
          })
        }
      })

      setStats({
        totalCases: caseList.length,
        personAWins: aWins,
        personBWins: bWins,
        sharedResponsibility: shared,
      })

      setTasks(allTasks)
    }
  }, [])

  const handleCompleteTask = (caseId: string, taskId: string) => {
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        return {
          ...c,
          courtOrders: c.courtOrders.map((order) =>
            order.id === taskId ? { ...order, completed: true } : order
          ),
        }
      }
      return c
    })
    setCases(updated)
    localStorage.setItem('courtroomCases', JSON.stringify(updated))
    setTasks(tasks.filter((t) => !(t.caseId === caseId && t.id === taskId)))
  }

  const handleDeleteCase = (caseId: string) => {
    const updated = cases.filter((c) => c.id !== caseId)
    setCases(updated)
    localStorage.setItem('courtroomCases', JSON.stringify(updated))
  }

  return (
    <CourtroomLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-b border-accent-gold/20 px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl font-bold text-accent-gold mb-2">⚖️ Courtroom Hub</h1>
              <p className="text-gray-400">Your case history, tasks, and court orders</p>
            </motion.div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 px-4">
          <div className="max-w-6xl mx-auto flex gap-0">
            {['overview', 'cases', 'tasks'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-6 py-4 font-semibold transition border-b-2 ${
                  selectedTab === tab
                    ? 'text-accent-gold border-accent-gold'
                    : 'text-gray-400 border-transparent hover:text-accent-gold hover:border-accent-gold/50'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'cases' && '📋 Cases'}
                {tab === 'tasks' && '✓ Tasks'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {selectedTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Quick Stats */}
                <div>
                  <h2 className="text-2xl font-bold text-accent-gold mb-4">📊 Your Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-4 text-center"
                    >
                      <div className="text-3xl font-bold text-accent-gold">{stats.totalCases}</div>
                      <div className="text-xs text-gray-400 mt-1">Total Cases</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 }}
                      className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center"
                    >
                      <div className="text-3xl font-bold text-blue-400">{stats.personAWins}</div>
                      <div className="text-xs text-gray-400 mt-1">Person A Wins</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center"
                    >
                      <div className="text-3xl font-bold text-green-400">{stats.personBWins}</div>
                      <div className="text-xs text-gray-400 mt-1">Person B Wins</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center"
                    >
                      <div className="text-3xl font-bold text-purple-400">{stats.sharedResponsibility}</div>
                      <div className="text-xs text-gray-400 mt-1">Shared Resp.</div>
                    </motion.div>
                  </div>
                </div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link href="/setup" className="block">
                    <button className="w-full bg-gradient-to-r from-accent-gold to-accent-red hover:shadow-lg text-black font-bold py-4 px-6 rounded-lg transition transform hover:scale-105">
                      ⚖️ Start New Case
                    </button>
                  </Link>
                </motion.div>

                {/* Recent Cases */}
                {cases.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-accent-gold mb-4">📜 Recent Cases</h2>
                    <div className="space-y-3">
                      {cases.slice(-3).reverse().map((caseItem, idx) => (
                        <motion.div
                          key={caseItem.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gray-800/50 border border-gray-700 hover:border-accent-gold/50 rounded-lg p-4 transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-accent-gold">{caseItem.title}</h3>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                caseItem.winner === 'personAFavored'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : caseItem.winner === 'personBFavored'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {caseItem.winner === 'personAFavored'
                                ? `${caseItem.personAName}`
                                : caseItem.winner === 'personBFavored'
                                ? `${caseItem.personBName}`
                                : 'Shared'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{caseItem.verdictSummary}...</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* CASES TAB */}
            {selectedTab === 'cases' && (
              <motion.div
                key="cases"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-accent-gold mb-4">📋 All Cases</h2>
                {cases.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                    <p className="text-gray-400 mb-4">No cases yet</p>
                    <Link href="/setup">
                      <button className="bg-accent-gold hover:bg-accent-gold/80 text-black font-bold px-6 py-2 rounded transition">
                        Start First Case
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.map((caseItem, idx) => (
                      <motion.div
                        key={caseItem.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-gray-800/50 border border-gray-700 hover:border-accent-gold/50 rounded-lg p-4 transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-accent-gold">{caseItem.title}</h3>
                            <p className="text-sm text-gray-400">
                              {caseItem.personAName} vs {caseItem.personBName}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded whitespace-nowrap ${
                              caseItem.winner === 'personAFavored'
                                ? 'bg-blue-500/20 text-blue-300'
                                : caseItem.winner === 'personBFavored'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {caseItem.winner === 'personAFavored'
                              ? `${caseItem.personAName} Favored`
                              : caseItem.winner === 'personBFavored'
                              ? `${caseItem.personBName} Favored`
                              : 'Shared Responsibility'}
                          </span>
                        </div>

                        <p className="text-sm text-gray-300 mb-3">{caseItem.verdictSummary}...</p>

                        <div className="text-xs text-gray-500 flex gap-4 mb-3">
                          <span>{new Date(caseItem.date).toLocaleDateString()}</span>
                          <span className="capitalize">Mode: {caseItem.mode}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteCase(caseItem.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Delete Case
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TASKS TAB */}
            {selectedTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-accent-gold mb-4">✓ Pending Tasks</h2>
                {tasks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                    <p className="text-gray-400">🎉 All tasks complete!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, idx) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-accent-red/5 border border-accent-red/30 rounded-lg p-4 hover:bg-accent-red/10 transition"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">{task.description}</h3>
                            <p className="text-sm text-gray-400">From: {task.caseTitle}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Assigned to: {task.assignedTo === 'both' ? 'Both' : task.assignedTo}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCompleteTask(task.caseId, task.id)}
                            className="bg-accent-gold hover:bg-accent-gold/80 text-black font-bold px-4 py-2 rounded transition whitespace-nowrap"
                          >
                            Mark Done
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CourtroomLayout>
  )
}
