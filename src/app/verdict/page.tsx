'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CourtroomLayout from '@/components/CourtroomLayout'
import VerdictCard from '@/components/VerdictCard'
import { Verdict } from '@/types'

export default function VerdictPage() {
  const router = useRouter()
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [caseTitle, setCaseTitle] = useState<string>('')

  useEffect(() => {
    const verdictData = sessionStorage.getItem('verdict')
    const titleData = sessionStorage.getItem('caseTitle')

    if (verdictData && titleData) {
      setVerdict(JSON.parse(verdictData))
      setCaseTitle(titleData)
    } else {
      router.push('/')
    }
  }, [router])

  if (!verdict) {
    return (
      <CourtroomLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading verdict...</div>
        </div>
      </CourtroomLayout>
    )
  }

  return (
    <CourtroomLayout>
      <div className="min-h-screen flex items-center justify-center py-8">
        <VerdictCard verdict={verdict} caseTitle={caseTitle} />
      </div>
    </CourtroomLayout>
  )
}
