// src/app/layout.tsx
import type { Metadata } from 'next'
import { Cinzel, Tajawal, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { env } from '@/lib/env'
import { GlobalErrorTracker } from '@/components/GlobalErrorTracker'
import { clsx } from 'clsx'
import { ThemeProvider } from '@/components/ThemeProvider'

const tajawal = Tajawal({
  weight: ['300', '400', '500', '700', '800'],
  subsets: ['latin', 'arabic'],
  variable: '--font-sans',
  display: 'swap',
})

const cinzel = Cinzel({
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={clsx(tajawal.variable, cinzel.variable, jetbrainsMono.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0F1113" />
      </head>
      <body className="bg-asas-sand dark:bg-asas-charcoal text-asas-charcoal dark:text-asas-sand antialiased font-sans flex flex-col min-h-screen selection:bg-asas-gold/30">
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(
                function(registration) { console.log('SW registration successful with scope: ', registration.scope); },
                function(err) { console.log('SW registration failed: ', err); }
              );
            });
          }
        `}} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalErrorTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
