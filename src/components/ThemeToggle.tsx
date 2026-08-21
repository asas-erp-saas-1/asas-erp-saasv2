'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'

export function ThemeToggle() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  // The authenticated operating system is intentionally dark-first.
  // Marketing/auth/portal surfaces can still use the global theme provider.
  if (pathname?.startsWith('/dashboard')) return null

  if (!mounted) {
    return <span className="h-10 w-10" aria-hidden="true" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
      className="relative rounded-xl p-2.5 text-asas-silver transition hover:bg-asas-sand/50 hover:text-asas-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asas-gold/60 dark:hover:bg-white/5 dark:hover:text-asas-sand"
    >
      {isDark ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
    </button>
  )
}
