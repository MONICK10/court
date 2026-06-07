'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0d0d1a' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
          <h2 style={{ color: '#c0a060', fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Court is temporarily unavailable
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
            Tap below to reconnect.
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
              width: '100%',
              maxWidth: 280,
            }}
          >
            Reconnect
          </button>
        </div>
      </body>
    </html>
  )
}
