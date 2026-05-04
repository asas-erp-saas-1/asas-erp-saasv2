// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { LayoutGrid, Users, Handshake, Building2, DollarSign, CheckSquare, BarChart2, Settings, LogOut, Bell, Search, Menu, UserSquare2 } from 'lucide-react'
import Link from 'next/link'
import { kernel } from '@/lib/kernel/core'
import { NextMobileMenu } from '@/components/MobileMenu'
const NAV = [
  { href: '/dashboard/overview',   label: 'Vue d\'ensemble',    Icon: LayoutGrid  },
  { href: '/dashboard/leads',      label: 'Pipeline Leads',     Icon: Users       },
  { href: '/dashboard/deals',      label: 'Transactions',       Icon: Handshake   },
  { href: '/dashboard/clients',    label: 'Base Clients',       Icon: UserSquare2 },
  { href: '/dashboard/properties', label: 'Propriétés',         Icon: Building2   },
  { href: '/dashboard/finance',    label: 'Finance',            Icon: DollarSign  },
  { href: '/dashboard/tasks',      label: 'Tâches',             Icon: CheckSquare },
  { href: '/dashboard/agents',     label: 'Classement Agents',  Icon: Users       },
  { href: '/dashboard/metrics',    label: 'Statistiques',       Icon: BarChart2   },
  { href: '/dashboard/settings',   label: 'Paramètres',         Icon: Settings    },
]

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let profile = {
    full_name: 'Unknown User',
    role: 'agent',
    avatar_url: null,
  };
  let identity;

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
  } catch (error) {
    // If auth fails, we probably should redirect to login
    // redirect('/login');
    console.error('Failed to resolve identity in layout', error);
  }

  const roleDisplay = profile.role === 'owner' ? 'CEO / Admin' : profile.role;
  const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex bg-[#0A0A0A] h-[100dvh] overflow-hidden selection:bg-blue-500/30 selection:text-white font-sans text-gray-100">
      {/* Sidebar - Desktop */}
      <aside className="w-[280px] bg-[#0A0A0A] border-r border-[#262626] flex-col shrink-0 hidden md:flex z-10 relative group">
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-bl from-blue-600 to-indigo-900 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-extrabold text-white tracking-tight leading-tight text-lg font-display">ASAS</p>
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-blue-400/80 leading-tight">Operating System</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-[#525252] uppercase tracking-widest mb-3 px-3">Menu Principal</p>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ href, label, Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#A3A3A3] rounded-xl hover:bg-[#171717] hover:text-white transition-all group relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-500 rounded-r-full transition-all group-hover:h-1/2 opacity-0 group-hover:opacity-100"></div>
                <Icon className="h-4 w-4 text-[#525252] group-hover:text-blue-400 transition-colors" strokeWidth={1.5} />
                <span className="group-hover:translate-x-0.5 transition-transform">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-6 py-6 border-t border-[#262626] shrink-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-gray-300 font-bold shrink-0 shadow-inner">
               {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{(profile as any)?.full_name}</p>
              <p className="text-[11px] text-[#A3A3A3] capitalize truncate font-medium">{roleDisplay}</p>
            </div>
          </div>
          
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-[#A3A3A3] hover:text-[#EF4444] bg-[#171717] hover:bg-[#EF4444]/10 border border-[#262626] hover:border-[#EF4444]/20 rounded-xl transition-all">
              <LogOut className="h-4 w-4" strokeWidth={2} /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#050505] rounded-tl-2xl md:rounded-tl-[2.5rem] border-t border-l border-[#262626] md:m-2 md:mr-0 md:mb-0 shadow-2xl">
        {/* Top Header */}
        <header className="h-[72px] bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sm:px-8 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <NextMobileMenu profile={profile} initial={initial} roleDisplay={roleDisplay} />
            <div className="hidden sm:flex items-center px-4 py-2.5 bg-[#171717] hover:bg-[#262626] border border-[#262626] hover:border-[#404040] rounded-2xl w-full focus-within:bg-[#050505] focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all group">
              <Search className="w-4 h-4 text-gray-500 mr-3 group-focus-within:text-blue-500 transition-colors" strokeWidth={2} />
              <input 
                type="text" 
                placeholder="Rechercher (Ctrl+K)..." 
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500 font-medium"
              />
              <div className="hidden lg:flex items-center gap-1">
                <kbd className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-[#0A0A0A] border border-[#262626] rounded-md shadow-sm">⌘</kbd>
                <kbd className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-[#0A0A0A] border border-[#262626] rounded-md shadow-sm">K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="absolute top-2.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0A] shadow-sm"></span>
            </button>
            <div className="w-px h-6 bg-[#262626] hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-white leading-none">{(profile as any)?.full_name}</span>
                <span className="text-[11px] text-gray-500 font-medium mt-1">{roleDisplay}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-900/50 to-blue-800/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-sm">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto flex flex-col w-full bg-[#050505] text-white custom-scrollbar relative bg-dot-grid">
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#0A0A0A] to-transparent pointer-events-none -z-10"></div>
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
