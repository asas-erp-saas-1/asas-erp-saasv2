'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutGrid, Users, Handshake, Building2, DollarSign, Settings, LogOut, Menu, X, ChevronRight, Calendar, Zap, Star, UserSquare2, Grid, Calculator, Receipt, ShoppingCart, ShieldAlert, Award, Webhook, Clock, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { ThemeToggle } from './ThemeToggle'
import { DASHBOARD_NAVIGATION } from '@/config/navigation'

const ICONS: Record<string, any> = {
  LayoutGrid, Users, Handshake, Building2, DollarSign, Settings, CalendarIcon: Calendar,
  Zap, Star, UserSquare2, Grid, Calculator, Receipt, ShoppingCart, ShieldAlert, Award, Webhook, Clock, Search,
}

export function NextMobileMenu({ profile, initial, roleDisplay }: { profile: any, initial: string, roleDisplay: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const role = profile?.role || 'agent'

  useEffect(() => setMounted(true), [])

  const bottomNav = role === 'agent'
    ? [
        { href: '/dashboard/overview', label: 'Vue', Icon: LayoutGrid },
        { href: '/dashboard/leads', label: 'Leads', Icon: Users },
        { href: '/dashboard/deals', label: 'Deals', Icon: Handshake },
        { href: '/dashboard/properties', label: 'Biens', Icon: Building2 },
      ]
    : [
        { href: '/dashboard/overview', label: 'Vue', Icon: LayoutGrid },
        { href: '/dashboard/leads', label: 'Leads', Icon: Users },
        { href: '/dashboard/finance', label: 'Finance', Icon: DollarSign },
        { href: '/dashboard/intelligence', label: 'Intel', Icon: Zap },
      ]

  if (!mounted) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[9000] border-t border-white/10 bg-[#081426]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:hidden">
        <nav className="flex h-[68px] items-center justify-around px-1" aria-label="Navigation mobile">
          {bottomNav.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link key={href} href={href} className={clsx('relative flex h-full w-full flex-col items-center justify-center gap-1 transition active:scale-95', isActive ? 'text-asas-gold' : 'text-white/45 hover:text-white')}>
                {isActive && <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 bg-asas-gold shadow-[0_0_10px_rgba(199,161,90,0.7)]" />}
                <Icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.2 : 1.7} />
                <span className="text-[9px] font-bold uppercase tracking-[0.14em]">{label}</span>
              </Link>
            )
          })}
          <button type="button" onClick={() => setIsOpen(true)} aria-label="Ouvrir le menu" className={clsx('flex h-full w-full flex-col items-center justify-center gap-1 text-white/45 transition active:scale-95 hover:text-white', isOpen && 'text-asas-gold')}>
            <Menu className="h-[21px] w-[21px]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.14em]">Menu</span>
          </button>
        </nav>
      </div>

      <div onClick={() => setIsOpen(false)} aria-hidden="true" className={clsx('fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm transition-opacity md:hidden', isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')} />

      <section className={clsx('fixed inset-x-0 bottom-0 z-[9999] flex flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-[#0A1629]/98 shadow-[0_-24px_70px_rgba(0,0,0,0.65)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden', isOpen ? 'translate-y-0' : 'translate-y-full')} style={{ top: '8%', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }} aria-label="Menu principal">
        <div className="flex w-full justify-center py-3"><div className="h-1.5 w-12 rounded-full bg-white/15" /></div>

        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-asas-gold/25 bg-white/5"><Building2 className="h-5 w-5 text-asas-gold" /></div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-white">ASAS <span className="font-light text-white/20">|</span> <span className="text-asas-gold">أساس</span></p>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">Enterprise OS</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Fermer le menu" className="rounded-xl p-2.5 text-white/50 transition hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
          {DASHBOARD_NAVIGATION.map((group) => {
            if (group.roles && !group.roles.includes(role)) return null
            return (
              <div key={group.group} className="mb-6">
                <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">{group.group}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = ICONS[item.iconName] || LayoutGrid
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={clsx('group flex items-center justify-between rounded-xl border px-3.5 py-3 transition active:scale-[0.99]', isActive ? 'border-asas-gold/20 bg-asas-gold/10 text-white' : 'border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white')}>
                        <span className="flex items-center gap-3">
                          <Icon className={clsx('h-4.5 w-4.5', isActive ? 'text-asas-gold' : 'text-white/35 group-hover:text-asas-gold')} />
                          <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
                        </span>
                        {isActive && <ChevronRight className="h-4 w-4 text-asas-gold/50" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="mb-3 flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#051121] font-bold text-asas-gold">{initial}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{profile?.full_name}</p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-widest text-white/35">{roleDisplay}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/25" />
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
