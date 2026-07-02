import React from 'react'
import { Building2, Bell, LogOut, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSession } from '@/eek/auth'
import { createTenantScopedDB } from '@/eek/db-proxy'
import { profiles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextMobileMenu } from '@/components/NextMobileMenu'
import { SidebarNav, NAV_GROUPS_STATE } from '@/components/SidebarNav'
import { DesktopOmnibarTrigger, MobileOmnibarTrigger } from '@/components/OmnibarTriggers'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CommandPalette } from '@/modules/dashboard/components/CommandPalette'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    redirect('/login');
  }

  const db = createTenantScopedDB(session.organizationId);
  const profilesResult = await db.select().from(profiles).where(
    and(eq(profiles.organizationId, session.organizationId), eq(profiles.id, session.user.id))
  ).limit(1);

  let profile = {
    full_name: 'Unknown User',
    role: session.role || 'agent',
    avatar_url: null,
  };

  if (profilesResult.length > 0) {
    profile = { ...profilesResult[0], role: session.role } as any;
  }

  const roleDisplay = profile.role === 'owner' ? 'CEO / Admin' : profile.role;
  const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';
  const role = profile.role || 'agent';

  return (
    <div className="flex bg-[#06152D] h-[100dvh] overflow-hidden selection:bg-asas-gold/30 selection:text-white text-white font-sans">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(212,166,79,0.05),_transparent_70%)]"></div>
         <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_left,_rgba(12,38,77,0.5),_transparent_60%)]"></div>
      </div>
      <NextMobileMenu profile={profile} initial={initial} roleDisplay={roleDisplay} />
      
      <aside className="w-[280px] bg-[#0A1829]/60 backdrop-blur-2xl border-r border-white/5 flex-col shrink-0 hidden md:flex z-10 relative">
        <div className="px-6 py-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-asas-gold/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(212,166,79,0.2)]">
              <div className="absolute inset-0 bg-asas-gold/10 rounded-xl blur-md"></div>
              <Building2 className="w-5 h-5 text-asas-gold relative z-10" />
            </div>
            <div>
              <p className="font-display font-bold text-white tracking-tight leading-none text-xl flex items-center gap-2">
                ASAS <span className="text-white/20 font-light text-base">|</span> <span className="font-sans font-medium text-lg text-asas-gold">أساس</span>
              </p>
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/40 leading-tight mt-1">Enterprise OS</p>
            </div>
          </div>
        </div>
        <SidebarNav navGroups={NAV_GROUPS_STATE} role={role} />
        <div className="mt-auto px-6 py-6 border-t border-white/5 shrink-0 relative z-10 bg-black/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#051121] border border-white/10 flex items-center justify-center text-asas-gold font-bold shrink-0 shadow-inner">
               {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{(profile as any)?.full_name}</p>
              <p className="text-xs text-white/40 capitalize truncate mt-0.5 tracking-wide">{roleDisplay}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:border-white/10">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-[#0A1629] border-l border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] md:rounded-l-3xl my-0 md:my-2 mr-0 md:mr-2">
        <header className="h-[72px] bg-[#0A1629]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-white/10 to-transparent border border-asas-gold/30 flex items-center justify-center shadow-[0_0_15px_rgba(212,166,79,0.2)]">
                <Building2 className="w-4 h-4 text-asas-gold" />
              </div>
            </div>
            <DesktopOmnibarTrigger />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <MobileOmnibarTrigger />
            <ThemeToggle />
            <button className="relative p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 active:scale-95">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/10 hidden sm:block mx-1"></div>
            <Link href="/dashboard/profile" className="hidden sm:flex items-center gap-3 pl-2 cursor-pointer group hover:opacity-80 transition-opacity active:scale-[0.98]">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-white leading-none group-hover:text-asas-gold transition-colors">{(profile as any)?.full_name}</span>
                <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{roleDisplay}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#051121] border border-white/10 flex items-center justify-center text-asas-gold font-bold shadow-inner group-hover:border-asas-gold/30 transition-colors">
                {initial}
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto flex flex-col w-full text-white custom-scrollbar relative pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col pt-6 md:pt-8 min-h-0">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
