'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Handshake, Users, MoreHorizontal, Building2 } from 'lucide-react'
import clsx from 'clsx'

const BOTTOM_NAV = [
  { href: '/dashboard/overview', label: 'Vue', Icon: LayoutGrid },
  { href: '/dashboard/leads', label: 'Leads', Icon: Users },
  { href: '/dashboard/deals', label: 'Deals', Icon: Handshake },
  { href: '/dashboard/properties', label: 'Biens', Icon: Building2 },
]

export function MobileBottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around px-2 h-16">
        {BOTTOM_NAV.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className={clsx("w-6 h-6 mb-0.5", isActive && "fill-blue-500/20")} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}
        
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <MoreHorizontal className="w-6 h-6 mb-0.5" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-wide">Menu</span>
        </button>
      </nav>
    </div>
  )
}
