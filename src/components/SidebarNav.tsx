'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Building2, DollarSign, Settings, Users, Handshake, LayoutGrid, UserSquare2, Calendar as CalendarIcon, Zap, Award, ShoppingCart, Receipt, Calculator, Clock, ShieldAlert, Webhook, Star, Search, Grid } from 'lucide-react'
import type { NavigationGroup } from '@/config/navigation'

const ICONS: Record<string, any> = {
  LayoutGrid, Users, Handshake, Building2, DollarSign, Settings,
  UserSquare2, CalendarIcon, Zap, Award, ShoppingCart, Receipt, Grid, Calculator,
  Clock, ShieldAlert, Webhook, Star, Search,
}

type SideBarNavProps = {
  navGroups: NavigationGroup[]
  role: string
}

export function SidebarNav({ navGroups, role }: SideBarNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar" aria-label="Navigation principale">
      {navGroups.map((navGroup) => {
        if (navGroup.roles && !navGroup.roles.includes(role)) return null
        if (!navGroup.items.length) return null

        return (
          <section key={navGroup.group} className="mb-6 last:mb-2">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">{navGroup.group}</p>
            <nav className="space-y-0.5">
              {navGroup.items.map(({ href, label, iconName, description }) => {
                const Icon = ICONS[iconName] || LayoutGrid
                const isActive = pathname === href || pathname.startsWith(`${href}/`)

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    title={description || label}
                    className={clsx(
                      'group relative flex min-h-10 items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none',
                      isActive
                        ? 'border-white/10 bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]'
                        : 'border-transparent text-white/55 hover:border-white/[0.06] hover:bg-white/[0.045] hover:text-white'
                    )}
                  >
                    <span aria-hidden="true" className={clsx('absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r-full bg-asas-gold transition-all duration-200', isActive ? 'h-5 opacity-100' : 'h-0 opacity-0 group-hover:h-4 group-hover:opacity-70')} />
                    <Icon className={clsx('h-[17px] w-[17px] shrink-0 transition-colors', isActive ? 'text-asas-gold' : 'text-white/35 group-hover:text-asas-gold')} strokeWidth={isActive ? 2 : 1.7} />
                    <span className={clsx('truncate text-[12px] tracking-wide', isActive ? 'font-semibold' : 'font-medium')}>{label}</span>
                  </Link>
                )
              })}
            </nav>
          </section>
        )
      })}
    </div>
  )
}
