// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { env } from '@/lib/env'

// Validate env on start
console.log('[ASAS] Booting application in', env.NODE_ENV);

export const metadata: Metadata = {
  title: 'ASAS RE-OS',
  description: 'Real Estate Operating System',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1A2A4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-[#050505] text-gray-100 antialiased flex flex-col min-h-screen selection:bg-blue-500/30">
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
