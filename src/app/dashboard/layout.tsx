// src/app/dashboard/layout.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutGrid, Users, Handshake, Building2, DollarSign, CheckSquare, BarChart2, Settings, LogOut, Bell, Search, Menu, UserSquare2 } from 'lucide-react'
import Link from 'next/link'

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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase.from('memberships').select('agency_id').eq('user_id', user.id).limit(1)
  
  if (!memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, role, avatar_url').eq('id', user.id).single()
  const roleDisplay = (profile as any)?.role === 'admin' ? 'CEO / Admin' : (profile as any)?.role;

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden md:flex shadow-sm z-10">
        <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1A2A4A] rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 tracking-tight leading-tight">ASAS</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 leading-tight">Real Estate OS</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Menu Principal</p>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ href, label, Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-[#1A2A4A] transition-all group">
                <Icon className="h-4 w-4 text-gray-400 group-hover:text-[#1A2A4A] transition-colors" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-6 py-4 border-t border-gray-100 pb-6 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1A2A4A] flex items-center justify-center text-white font-bold shrink-0">
               {(profile as any)?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{(profile as any)?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{roleDisplay}</p>
            </div>
          </div>
          
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-w-sm w-full focus-within:ring-2 focus-within:ring-[#1A2A4A] focus-within:border-transparent transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto w-full bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
