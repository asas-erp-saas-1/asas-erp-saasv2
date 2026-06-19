'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Home, Users, Building2, MathOperations, DollarSign, Sparkles } from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { href: '/dashboard/overview', label: 'Home', icon: Home },
  { href: '/dashboard/deals', label: 'CRM', icon: Users },
  { href: '/dashboard/projects', label: 'Projects', icon: Building2 },
  { href: '/dashboard/finance', label: 'Finance', icon: DollarSign },
  { href: '/dashboard/copilot', label: 'AI', icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      {/* Mobile nav bar container */}
      <div className="bg-[#051121]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-around px-2 py-3 overflow-hidden relative">
        
        {/* Top subtle highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 w-16 relative"
            >
              <div 
                className={clsx(
                  "p-2 rounded-xl transition-all duration-300 relative",
                  isActive 
                    ? "bg-asas-gold/10 text-asas-gold shadow-[0_0_15px_rgba(212,166,79,0.3)]" 
                    : "text-white/40 hover:text-white"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-asas-gold" : "text-white/40")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span 
                className={clsx(
                  "text-[10px] uppercase font-bold tracking-widest transition-colors",
                  isActive ? "text-asas-gold" : "text-white/30"
                )}
              >
                {item.label}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-asas-gold shadow-[0_0_8px_rgba(212,166,79,1)]"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
