import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'AI Relationship Court',
  description: 'Settle your arguments with AI lawyers and a judge. Dramatic, witty, and entertaining.',
  keywords: ['AI', 'Relationship', 'Court', 'Humor', 'Entertainment'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CourtRoom',
  },
  openGraph: {
    title: 'AI Relationship Court',
    description: 'Settle your arguments with AI lawyers and a judge.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#c0a060',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CourtRoom" />
        {/* Eruda — mobile console for debugging, remove after fix is confirmed */}
        <script src="https://cdn.jsdelivr.net/npm/eruda" />
        <script dangerouslySetInnerHTML={{ __html: 'eruda.init()' }} />
        {/* Register service worker for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
