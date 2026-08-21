import React from 'react'
import { Building2, Bell, LogOut } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSession } from '@/eek/auth'
import { createTenantScopedDB } from '@/eek/db-proxy'
import { users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextMobileMenu } from '@/components/MobileMenu'
import { SidebarNav } from '@/components/SidebarNav'
import { DesktopOmnibarTrigger, MobileOmnibarTrigger } from '@/components/OmnibarTriggers'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CommandPalette } from '@/components/CommandPalette'
import { DASHBOARD_NAVIGATION } from '@/config/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session
  try {
    session = await requireSession()
  } catch {
    redirect('/login')
  }

  const db = createTenantScopedDB(session.organizationId)
  const usersResult = await db
    .select()
    .from(users)
    .where(and(eq(users.organizationId, session.organizationId), eq(users.id, session.user.id)))
    .limit(1)

  let profile = {
    full_name: 'Unknown User',
    role: session.role || 'agent',
    avatar_url: null,
  }

  if (usersResult.length > 0) {
    profile = { ...usersResult[0], role: session.role } as any
  }

  const roleDisplay = profile.role === 'owner' ? 'CEO / Admin' : profile.role
  const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'
  const role = profile.role || 'agent'

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#06152D] text-white selection:bg-asas-gold/30 selection:text-white font-sans">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute right-0 top-0 h-[55%] w-[55%] bg-[radial-gradient(ellipse_at_top_right,_rgba(199,161,90,0.08),_transparent_68%)]" />
        <div className="absolute bottom-0 left-0 h-[45%] w-[45%] bg-[radial-gradient(circle_at_bottom_left,_rgba(12,38,77,0.55),_transparent_65%)]" />
      </div>

      <NextMobileMenu profile={profile} initial={initial} roleDisplay={roleDisplay} />

      <aside className="relative z-10 hidden w-[288px] shrink-0 flex-col border-r border-white/[0.07] bg-[#081426]/88 backdrop-blur-2xl md:flex">
        <div className="px-6 pb-5 pt-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-asas-gold/30 bg-gradient-to-b from-white/10 to-transparent shadow-[0_0_18px_rgba(199,161,90,0.16)]">
              <div className="absolute inset-0 rounded-xl bg-asas-gold/10 blur-md" />
              <Building2 className="relative z-10 h-5 w-5 text-asas-gold" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-display text-xl font-bold leading-none tracking-tight text-white">
                ASAS <span className="font-light text-white/20">|</span> <span className="font-sans text-lg font-medium text-asas-gold">أساس</span>
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Enterprise OS</p>
            </div>
          </div>
        </div>

        <SidebarNav navGroups={DASHBOARD_NAVIGATION} role={role} />

        <div className="relative z-10 mt-auto shrink-0 border-t border-white/[0.07] bg-black/10 px-5 py-5">
          <Link href="/dashboard/profile" className="group mb-4 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#051121] font-bold text-asas-gold shadow-inner">
              {initial}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-semibold text-white group-hover:text-asas-gold">{profile.full_name}</p>
              <p className="mt-0.5 truncate text-xs capitalize tracking-wide text-white/40">{roleDisplay}</p>
            </div>
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/15 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asas-gold/60">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="relative z-10 my-0 mr-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0A1629] shadow-[0_0_50px_rgba(0,0,0,0.5)] md:my-2 md:mr-2 md:rounded-l-3xl md:border-l md:border-white/[0.06]">
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0A1629]/88 px-4 backdrop-blur-xl sm:px-8" role="banner">
          <div className="flex w-full max-w-2xl items-center gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-asas-gold/30 bg-white/5 shadow-[0_0_15px_rgba(199,161,90,0.14)]">
                <Building2 className="h-4 w-4 text-asas-gold" />
              </div>
            </div>
            <DesktopOmnibarTrigger />
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <MobileOmnibarTrigger />
            <ThemeToggle />
            <button aria-label="Notifications" className="relative rounded-xl border border-transparent p-2.5 text-white/50 transition hover:border-white/10 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asas-gold/60">
              <Bell className="h-5 w-5" />
            </button>
            <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
            <Link href="/dashboard/profile" className="group hidden items-center gap-3 rounded-xl pl-2 sm:flex">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold leading-none text-white transition group-hover:text-asas-gold">{profile.full_name}</span>
                <span className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{roleDisplay}</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#051121] font-bold text-asas-gold shadow-inner transition group-hover:border-asas-gold/30">
                {initial}
              </div>
            </Link>
          </div>
        </header>

        <main className="relative flex w-full flex-1 flex-col overflow-y-auto pb-[calc(7rem+env(safe-area-inset-bottom))] text-white custom-scrollbar md:pb-0">
          <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-4 pb-8 pt-5 sm:px-6 md:px-8 md:pt-7">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
