// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { env } from '@/lib/env'
import { GlobalErrorTracker } from '@/components/GlobalErrorTracker'
import { clsx } from 'clsx'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// Validate env on start
console.log('[ASAS] Booting application in', env.NODE_ENV);

export const metadata: Metadata = {
  title: 'ASAS RE-OS',
  description: 'Real Estate Operating System',
};

export const viewport = {
  themeColor: '#1A2A4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={clsx(inter.variable, spaceGrotesk.variable, jetbrainsMono.variable)}>
      <body className="bg-[#050505] text-gray-100 antialiased font-sans flex flex-col min-h-screen selection:bg-blue-500/30">
        <GlobalErrorTracker />
        {children}
      </body>
    </html>
  )
}
