'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Users, Handshake, Building2, DollarSign, CheckSquare, BarChart2, Settings, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard/overview',   label: 'Vue d\'ensemble',    Icon: LayoutGrid  },
  { href: '/dashboard/leads',      label: 'Pipeline Leads',     Icon: Users       },
  { href: '/dashboard/deals',      label: 'Transactions',       Icon: Handshake   },
  { href: '/dashboard/clients',    label: 'Base Clients',       Icon: Users /* Replace UserSquare2 due to import issues if any, just use Users or import directly */ },
  { href: '/dashboard/properties', label: 'Propriétés',         Icon: Building2   },
  { href: '/dashboard/finance',    label: 'Finance',            Icon: DollarSign  },
  { href: '/dashboard/tasks',      label: 'Tâches',             Icon: CheckSquare },
  { href: '/dashboard/agents',     label: 'Classement Agents',  Icon: Users       },
  { href: '/dashboard/metrics',    label: 'Statistiques',       Icon: BarChart2   },
  { href: '/dashboard/settings',   label: 'Paramètres',         Icon: Settings    },
]

export function NextMobileMenu({ profile, initial, roleDisplay }: { profile: any, initial: string, roleDisplay: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const BOTTOM_NAV = [
    { href: '/dashboard/overview', label: 'Vue', Icon: LayoutGrid },
    { href: '/dashboard/leads', label: 'Leads', Icon: Users },
    { href: '/dashboard/deals', label: 'Deals', Icon: Handshake },
    { href: '/dashboard/properties', label: 'Biens', Icon: Building2 },
  ]

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <nav className="flex items-center justify-around px-2 h-16">
          {BOTTOM_NAV.map(({ href, label, Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95",
                  isActive ? "text-blue-400" : "text-[#737373] hover:text-gray-300"
                )}
              >
                <Icon 
                  className={clsx("w-6 h-6 mb-0.5 transition-transform duration-200", isActive ? "scale-105" : "scale-100")} 
                  strokeWidth={isActive ? 2 : 1.5} 
                />
                <span className={clsx("text-[10px] font-medium tracking-wide", isActive ? "font-bold" : "")}>{label}</span>
              </Link>
            )
          })}
          
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[#737373] hover:text-gray-300 transition-all duration-200 active:scale-95"
          >
            <Menu className="w-6 h-6 mb-0.5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wide">Menu</span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div key="mobile-menu-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 top-[10%] bg-[#0A0A0A] rounded-t-3xl border-t border-white/10 z-[101] md:hidden flex flex-col shadow-2xl overflow-hidden"
            >
              {/* iOS Sheet Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-12 h-1.5 bg-[#262626] rounded-full"></div>
              </div>

              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-bl from-blue-600 to-indigo-900 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                    <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white tracking-tight leading-tight text-lg font-display">ASAS</p>
                    <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-blue-400/80 leading-tight">OS Mobile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar pb-32">
                <p className="text-[10px] font-bold text-[#525252] uppercase tracking-widest mb-4 px-3">Menu Principal</p>
                <nav className="flex flex-col gap-1.5">
                  {NAV.map(({ href, label, Icon }) => {
                    const isActive = pathname.startsWith(href)
                    return (
                      <Link 
                        key={href} 
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={clsx(
                          "flex items-center justify-between px-3 py-3.5 text-sm font-bold rounded-xl transition-all relative overflow-hidden group",
                          isActive 
                            ? "text-white bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                            : "text-[#A3A3A3] hover:bg-[#171717] hover:text-white border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Icon className={clsx("h-5 w-5 transition-colors", isActive ? "text-blue-400" : "text-[#525252] group-hover:text-gray-400")} strokeWidth={isActive ? 2 : 1.5} />
                          <span>{label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 text-blue-500/50" />}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="border-t border-white/5 px-6 py-6 bg-[#050505]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-gray-300 font-bold shrink-0 shadow-inner">
                    {initial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{profile?.full_name}</p>
                    <p className="text-[11px] text-[#A3A3A3] capitalize truncate font-medium">{roleDisplay}</p>
                  </div>
                </div>
                
                <form action="/auth/signout" method="post">
                  <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 rounded-xl transition-all">
                    <LogOut className="h-4 w-4" strokeWidth={2} /> Déconnexion
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
