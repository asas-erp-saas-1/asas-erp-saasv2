// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { env } from '@/lib/env'
import { AuthProvider } from '@/context/AuthContext'

// Validate env on start
console.log('[ASAS] Booting application in', env.NODE_ENV);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-[#050505] text-gray-100 antialiased font-sans flex flex-col min-h-screen selection:bg-blue-500/30">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
