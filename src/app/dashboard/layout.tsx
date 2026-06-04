// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { LayoutGrid, Users, Handshake, Building2, DollarSign, CheckSquare, BarChart2, Settings, LogOut, Bell, Search, Menu, UserSquare2, Calendar as CalendarIcon, Zap, Award, Bot } from 'lucide-react';
import Link from 'next/link'
import { kernel } from '@/lib/kernel/core'
import { NextMobileMenu } from '@/components/MobileMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CommandPalette } from '@/components/CommandPalette'
import { DesktopOmnibarTrigger, MobileOmnibarTrigger } from '@/components/OmnibarTriggers'

const NAV_GROUPS = [
  {
    group: "Command Center",
    items: [
      { href: '/dashboard/overview',   label: 'Hub Opérationnel',   Icon: LayoutGrid },
      { href: '/dashboard/tasks',      label: 'Tâches & Actions',   Icon: CheckSquare },
      { href: '/dashboard/calendar',   label: 'Agenda',             Icon: CalendarIcon },
    ]
  },
  {
    group: "Commercial & CRM",
    items: [
      { href: '/dashboard/leads',      label: 'Pipeline Prospection',Icon: Users },
      { href: '/dashboard/deals',      label: 'Dossiers Vente',      Icon: Handshake },
      { href: '/dashboard/clients',    label: 'Base Profils',       Icon: UserSquare2 },
    ]
  },
  {
    group: "Construction & Projets",
    items: [
      { href: '/dashboard/projects',   label: 'Projets',            Icon: Building2 },
      { href: '/dashboard/properties', label: 'Unités (Biens)',     Icon: Building2 },
      { href: '/dashboard/sav',        label: 'Livraison & SAV',    Icon: CheckSquare },
    ]
  },
  {
    group: "Finance & Comptabilité",
    items: [
      { href: '/dashboard/finance',    label: 'Trésorerie & Encaissements', Icon: DollarSign },
      { href: '/dashboard/agents',     label: 'RH & Commerciaux',  Icon: Users },
    ],
    roles: ['owner', 'admin', 'finance']
  },
  {
    group: "Gouvernance & Paramètres",
    items: [
      { href: '/dashboard/intelligence', label: 'Dashboard Décisionnel', Icon: Award },
      { href: '/dashboard/orchestration', label: 'Automatismes', Icon: Zap },
      { href: '/dashboard/settings',   label: 'Structure & Organisation',         Icon: Settings },
    ],
    roles: ['owner', 'admin']
  }
]

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let profile = {
    full_name: 'Unknown User',
    role: 'agent',
    avatar_url: null,
  };
  let identity;
  let shouldRedirectTo: string | null = null;
  let unhandledError = null;

  try {
    try {
      identity = await kernel.identity();
      const profiles = await kernel.query<any>('profiles', {
        filters: { id: identity.userId, agency_id: identity.tenantId }
      });
      if (profiles && profiles.length > 0) {
        profile = {
          ...profiles[0],
          role: identity.role
        };
      }
    } catch (error: any) {
      const errorMsg = error?.message || '';
      console.error('Failed to resolve identity in layout:', errorMsg);
      if (errorMsg.includes('Tenant isolation failure')) {
        shouldRedirectTo = '/onboarding';
      } else {
        shouldRedirectTo = '/login';
      }
    }

    if (shouldRedirectTo) {
      redirect(shouldRedirectTo);
    }

    if (!identity) {
      return null;
    }

    const roleDisplay = profile.role === 'owner' ? 'CEO / Admin' : profile.role;
    const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

    const role = profile.role || 'agent';

    return (
      <div className="flex bg-asas-sand dark:bg-asas-charcoal h-[100dvh] overflow-hidden selection:bg-asas-gold/30 selection:text-asas-charcoal dark:text-asas-sand font-sans text-asas-charcoal dark:text-asas-sand">
        <NextMobileMenu profile={profile} initial={initial} roleDisplay={roleDisplay} />
        {/* Sidebar - Desktop */}
        <aside className="w-[280px] bg-[#F8F9FA] dark:bg-[#141618] border-r border-gray-200 dark:border-white/5 flex-col shrink-0 hidden md:flex z-10 relative group">
          <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-asas-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="px-6 py-8 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-asas-navy shadow-[0_0_15px_rgba(10,25,47,0.1)] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-asas-gold" />
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-xl flex items-center gap-2">
                  ASAS <span className="text-gray-300 dark:text-gray-700 font-light text-base">|</span> <span className="font-sans font-medium text-lg">أساس</span>
                </p>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-asas-gold leading-tight mt-0.5">Real Estate ERP</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
            {NAV_GROUPS.map((navGroup) => {
               if (navGroup.roles && !navGroup.roles.includes(role)) return null;
               return (
                 <div key={navGroup.group}>
                   <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">{navGroup.group}</p>
                   <nav className="flex flex-col gap-1">
                     {navGroup.items.map(({ href, label, Icon }) => (
                       <Link key={href} href={href}
                         className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all group relative">
                         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r bg-asas-gold transition-all group-hover:h-1/2 opacity-0 group-hover:opacity-100"></div>
                         <Icon className="h-4 w-4 text-gray-400 group-hover:text-asas-gold transition-colors" />
                         <span className="group-hover:translate-x-1 transition-transform">{label}</span>
                       </Link>
                     ))}
                   </nav>
                 </div>
               )
            })}
          </div>

          <div className="mt-auto px-6 py-6 border-t border-gray-200 dark:border-white/5 shrink-0 relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-asas-navy border border-asas-gold/20 flex items-center justify-center text-white font-medium shrink-0">
                 {initial}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{(profile as any)?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize truncate font-medium">{roleDisplay}</p>
              </div>
            </div>
            
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all">
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white dark:bg-[#0B0C0E] border-l border-gray-200 dark:border-white/5 shadow-[0_0_30px_rgb(0,0,0,0.02)]">
          {/* Top Header */}
          <header className="h-[72px] bg-white/80 dark:bg-[#0B0C0E]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sm:px-8 shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-4 w-full max-w-xl">
              <div className="md:hidden flex items-center gap-2">
                <Building2 className="w-5 h-5 text-asas-gold" />
                <p className="font-extrabold text-gray-900 dark:text-white tracking-widest uppercase leading-tight text-lg font-display">ASAS</p>
              </div>
              
              <DesktopOmnibarTrigger />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <MobileOmnibarTrigger />
              <ThemeToggle />
              <button className="relative p-2.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-asas-gold rounded-full border-2 border-white dark:border-[#0B0C0E]"></span>
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{(profile as any)?.full_name}</span>
                  <span className="text-xs text-gray-500 font-medium mt-1">{roleDisplay}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-asas-navy border border-asas-gold/20 flex items-center justify-center text-white font-medium">
                  {initial}
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Main Area */}
          <main className="flex-1 overflow-y-auto flex flex-col w-full text-gray-900 dark:text-white custom-scrollbar relative pb-28 md:pb-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-asas-gold/5 dark:bg-asas-gold/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col pt-8">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
      </div>
    )
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
    unhandledError = err;
  }

  if (unhandledError) {
    return (
      <div className="p-8 bg-red-900 border border-red-500 rounded text-black m-8">
        <h1 className="text-xl font-bold">Layout Unhandled Crash</h1>
        <pre className="mt-4 p-4 bg-black text-red-500 border border-red-500/50 rounded">{String(unhandledError.message)}</pre>
        <pre className="mt-4 text-xs opacity-50">{String((unhandledError as any)?.stack)}</pre>
      </div>
    );
  }
}
