'use client'

import { useEffect } from 'react'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
      <h2 style={{ color: '#c0a060', fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
        The court hit a snag. Tap below to try again — your session may still be active.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#c0a060',
          color: '#0d0d1a',
          fontWeight: 'bold',
          padding: '12px 32px',
          borderRadius: 8,
          border: 'none',
          fontSize: 15,
          cursor: 'pointer',
          marginBottom: 12,
          width: '100%',
          maxWidth: 280,
        }}
      >
        Try Again
      </button>
      <button
        onClick={() => { window.location.href = '/' }}
        style={{
          background: 'transparent',
          color: '#6b7280',
          fontWeight: 'bold',
          padding: '12px 32px',
          borderRadius: 8,
          border: '1px solid #374151',
          fontSize: 14,
          cursor: 'pointer',
          width: '100%',
          maxWidth: 280,
        }}
      >
        ← Back to Home
      </button>
    </div>
  )
}
