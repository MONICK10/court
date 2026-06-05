'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CourtroomLayout from '@/components/CourtroomLayout'
import { motion } from 'framer-motion'

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

export default function DashboardPage() {
  const router = useRouter()
  const [cases, setCases] = useState<StoredCase[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCases: 0,
    personAWins: 0,
    personBWins: 0,
    sharedResponsibility: 0,
    tasksCompleted: 0,
  })

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
      let completed = 0
      let allTasks: any[] = []

      caseList.forEach((c: StoredCase) => {
        if (c.winner === 'personAFavored') aWins++
        else if (c.winner === 'personBFavored') bWins++
        else if (c.winner === 'sharedResponsibility') shared++

        if (c.courtOrders) {
          c.courtOrders.forEach((order) => {
            if (order.completed) completed++
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
        tasksCompleted: completed,
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

    // Update tasks
    setTasks(tasks.filter((t) => !(t.caseId === caseId && t.id === taskId)))
  }

  const handleDeleteCase = (caseId: string) => {
    const updated = cases.filter((c) => c.id !== caseId)
    setCases(updated)
    localStorage.setItem('courtroomCases', JSON.stringify(updated))
  }

  return (
    <CourtroomLayout>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold text-accent-gold mb-2">⚖️ Courtroom Dashboard</h1>
            <p className="text-gray-400">Your case history and pending tasks</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats + Cases */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-accent-gold">{stats.totalCases}</div>
                <div className="text-xs text-gray-400 mt-1">Total Cases</div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.personAWins}</div>
                <div className="text-xs text-gray-400 mt-1">Wins</div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.sharedResponsibility}</div>
                <div className="text-xs text-gray-400 mt-1">Shared Resp.</div>
              </div>
            </motion.div>

            {/* New Case Button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <Link
                href="/setup"
                className="inline-block w-full bg-accent-red hover:bg-accent-red/80 text-black font-bold py-3 px-6 rounded-lg text-center transition"
              >
                + Start New Case
              </Link>
            </motion.div>

            {/* Case History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-2xl font-bold text-accent-gold mb-4">📋 Case History</h2>
              <div className="space-y-3">
                {cases.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    <p className="mb-2">No cases yet</p>
                    <Link href="/setup" className="text-accent-gold hover:text-accent-gold/80">
                      Start your first case →
                    </Link>
                  </div>
                ) : (
                  cases.map((caseItem, idx) => (
                    <motion.div
                      key={caseItem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-gray-800/50 border border-gray-700 hover:border-accent-gold/50 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition"
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
                            ? `${caseItem.personAName} Favored`
                            : caseItem.winner === 'personBFavored'
                            ? `${caseItem.personBName} Favored`
                            : 'Shared Responsibility'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-400 mb-2">
                        <p>
                          {caseItem.personAName} vs {caseItem.personBName}
                        </p>
                        <p>{new Date(caseItem.date).toLocaleDateString()}</p>
                        <p className="capitalize">Mode: {caseItem.mode}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteCase(caseItem.id)}
                        className="text-xs text-red-400 hover:text-red-300 mt-2"
                      >
                        Delete
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Pending Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-2xl font-bold text-accent-gold mb-4">✓ Pending Tasks</h2>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
                  <p>No pending tasks!</p>
                  <p className="text-xs mt-2">All court orders complete</p>
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3"
                  >
                    <p className="text-sm font-semibold text-white mb-1">{task.description}</p>
                    <p className="text-xs text-gray-400 mb-2">{task.caseTitle}</p>
                    <button
                      onClick={() => handleCompleteTask(task.caseId, task.id)}
                      className="text-xs bg-accent-gold hover:bg-accent-gold/80 text-black font-bold px-3 py-1 rounded transition"
                    >
                      Mark Done
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </CourtroomLayout>
  )
}
