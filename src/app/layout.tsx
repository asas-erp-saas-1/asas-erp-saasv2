import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { env } from '@/lib/env'
import { clsx } from 'clsx'
import { ThemeProvider } from '@/components/ThemeProvider'

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

console.log('[ASAS] Booting application in', env.NODE_ENV)

export const metadata: Metadata = {
  title: 'ASAS RE-OS — Real Estate Enterprise Operating System',
  description: 'ERP, CRM, promotion immobilière, finance, construction et intelligence opérationnelle dans une plateforme unifiée.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#081426',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={clsx(inter.variable, spaceGrotesk.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen bg-asas-sand font-sans text-asas-charcoal antialiased selection:bg-asas-gold/30 dark:bg-asas-charcoal dark:text-asas-sand">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
