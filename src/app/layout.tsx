// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { env } from '@/lib/env'

// Validate env on start
console.log('[ASAS] Booting application in', env.NODE_ENV);

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title:       'ASAS RE-OS',
  description: 'Real Estate Operating System',
  manifest:    '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1A2A4A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#050505] text-gray-100 antialiased font-sans flex flex-col min-h-screen selection:bg-blue-500/30">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(console.error)
            })
          }
        `}} />
      </body>
    </html>
  )
}
