'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutGrid, Users, Handshake, Building2, DollarSign, CheckSquare, BarChart2, Settings, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard/overview',   label: 'Vue d\'ensemble',    Icon: LayoutGrid  },
  { href: '/dashboard/leads',      label: 'Pipeline Leads',     Icon: Users       },
  { href: '/dashboard/deals',      label: 'Transactions',       Icon: Handshake   },
  { href: '/dashboard/clients',    label: 'Base Clients',       Icon: Users       },
  { href: '/dashboard/projects',   label: 'Programmes',         Icon: Building2   },
  { href: '/dashboard/properties', label: 'Biens (Unités)',     Icon: Building2   },
  { href: '/dashboard/finance',    label: 'Finance',            Icon: DollarSign  },
  { href: '/dashboard/tasks',      label: 'Tâches',             Icon: CheckSquare },
  { href: '/dashboard/agents',     label: 'Classement Agents',  Icon: Users       },
  { href: '/dashboard/metrics',    label: 'Statistiques',       Icon: BarChart2   },
  { href: '/dashboard/settings',   label: 'Paramètres',         Icon: Settings    },
]

export function NextMobileMenu({ profile, initial, roleDisplay }: { profile: any, initial: string, roleDisplay: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const BOTTOM_NAV = [
    { href: '/dashboard/overview', label: 'Vue', Icon: LayoutGrid },
    { href: '/dashboard/leads', label: 'Leads', Icon: Users },
    { href: '/dashboard/deals', label: 'Deals', Icon: Handshake },
    { href: '/dashboard/properties', label: 'Biens', Icon: Building2 },
  ]

  if (!mounted) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9000] bg-white dark:bg-[#0A0A0A]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300">
        <nav className="flex items-center justify-around px-2 h-[68px]">
          {BOTTOM_NAV.map(({ href, label, Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95 relative",
                  isActive ? "text-blue-400" : "text-[#737373] hover:text-gray-800 dark:text-gray-300"
                )}
              >
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                )}
                <Icon 
                  className="w-[22px] h-[22px] mb-0.5 transition-all duration-200" 
                  strokeWidth={isActive ? 2 : 1.5} 
                />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </Link>
            )
          })}
          
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[#737373] hover:text-gray-800 dark:text-gray-300 transition-all duration-200 active:scale-95 relative"
          >
            {isOpen && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            )}
            <div className={clsx("flex flex-col items-center space-y-1", isOpen ? "text-blue-400" : "")}>
              <Menu className="w-[22px] h-[22px] mb-0.5 transition-all duration-200" strokeWidth={isOpen ? 2 : 1.5} />
              <span className="text-[10px] tracking-wide font-medium">Menu</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        className={clsx(
          "md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sheet */}
      <div
        className={clsx(
          "md:hidden fixed inset-x-0 bottom-0 z-[9999] bg-white dark:bg-[#0A0A0A] rounded-t-[2rem] border-t border-black/10 dark:border-white/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.7)] overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ 
          top: '12%',
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        {/* iOS Sheet Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>

        <div className="px-6 pb-5 pt-1 flex items-center justify-between border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-bl from-blue-600 to-indigo-900 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Building2 className="w-5 h-5 text-gray-900 dark:text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white tracking-tight leading-none text-xl font-display">ASAS</p>
              <p className="text-[9px] uppercase font-bold tracking-[0.25em] text-blue-400/90 leading-tight mt-0.5">OS Mobile</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 transition-colors active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar overscroll-contain">
          <p className="text-[10px] font-bold text-[#525252] uppercase tracking-widest mb-3 px-2">Menu Principal</p>
          <nav className="flex flex-col gap-2">
            {NAV.map(({ href, label, Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link 
                  key={href} 
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-4 py-4 text-sm font-bold rounded-2xl transition-all relative overflow-hidden group active:scale-[0.98]",
                    isActive 
                      ? "text-gray-900 dark:text-white bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                      : "text-[#A3A3A3] bg-gray-50 dark:bg-[#050505] hover:bg-gray-200 dark:bg-[#171717] hover:text-gray-900 dark:text-white border border-black/5 dark:border-white/5"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <Icon className={clsx("h-5 w-5 transition-colors", isActive ? "text-blue-400" : "text-[#525252] group-hover:text-gray-600 dark:text-gray-400")} strokeWidth={isActive ? 2 : 1.5} />
                    <span className="tracking-wide text-[15px]">{label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-5 h-5 text-blue-500/50" />}
                </Link>
              )
            })}
          </nav>
          <div className="h-6"></div> {/* Extra space at bottom of scroll list */}
        </div>

        <div className="border-t border-black/5 dark:border-white/5 px-6 py-5 bg-gray-50 dark:bg-[#050505] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border border-gray-600 flex items-center justify-center text-gray-900 dark:text-white font-bold shrink-0 shadow-lg relative">
                {initial}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#050505]"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white truncate leading-tight">{profile?.full_name}</p>
                <p className="text-[11px] text-[#A3A3A3] capitalize truncate font-medium">{roleDisplay}</p>
              </div>
            </div>
          </div>
          
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-[15px] font-bold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 rounded-xl transition-all active:scale-[0.98]">
              <LogOut className="h-5 w-5" strokeWidth={2} /> Déconnexion
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

