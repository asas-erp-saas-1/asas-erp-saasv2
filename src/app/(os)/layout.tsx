'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Briefcase, 
  Inbox, 
  LayoutDashboard, 
  Calculator, 
  Gavel, 
  Users, 
  ChevronDown,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  Building
} from 'lucide-react';
import { clsx } from 'clsx';

type AgencyContextType = 'INVEPRO' | 'ASAS';

export default function OSLayout({ children }: { children: React.ReactNode }) {
  const [agencyContext, setAgencyContext] = useState<AgencyContextType>('INVEPRO');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleAgencyContext = () => {
    setAgencyContext(prev => prev === 'INVEPRO' ? 'ASAS' : 'INVEPRO');
  };

  const navItems = [
    { label: 'Inbox', href: '/inbox', icon: Inbox },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'CRM', href: '/crm/pipeline', icon: Users },
    { label: 'ERP / Inventory', href: '/erp/inventory', icon: Building2 },
    { label: 'Finance', href: '/finance', icon: Calculator },
    { label: 'Legal & VSP', href: '/legal', icon: Gavel },
  ];

  const brandStyles = {
    INVEPRO: {
      sidebarBg: 'bg-asas-charcoal',
      textHigh: 'text-asas-sand',
      textDim: 'text-asas-silver',
      accent: 'text-asas-copper',
      border: 'border-asas-charcoal',
      badge: 'bg-asas-copper/20 text-asas-copper',
      logoText: 'INVEPRO'
    },
    ASAS: {
      sidebarBg: 'bg-asas-emerald',
      textHigh: 'text-asas-sand',
      textDim: 'text-[#A7A9AC]', // asas-silver
      accent: 'text-asas-gold',
      border: 'border-asas-emerald',
      badge: 'bg-asas-gold/20 text-asas-gold',
      logoText: 'ASAS BROKERAGE'
    }
  };

  const theme = brandStyles[agencyContext];

  return (
    <div className="flex h-screen w-full bg-asas-sand dark:bg-[#08090A] overflow-hidden selection:bg-asas-gold/30">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out lg:relative border-r border-asas-silver/20 dark:border-white/5",
          theme.sidebarBg,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* GLOBAL AGENCY CONTEXT SWITCHER (TOP OF SIDEBAR) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={clsx("w-8 h-8 rounded-sm flex items-center justify-center font-display text-lg font-bold border border-white/20", theme.textHigh)}>
               {theme.logoText.charAt(0)}
            </div>
            <span className={clsx("font-display font-semibold tracking-wider text-sm", theme.textHigh)}>
               {theme.logoText}
            </span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={toggleAgencyContext}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-sm p-3 group"
          >
            <div className="flex items-center gap-2">
              <Briefcase size={16} className={theme.accent} />
              <span className={clsx("text-xs font-semibold uppercase tracking-wider", theme.textHigh)}>
                Context: {agencyContext}
              </span>
            </div>
            <ChevronDown size={14} className={theme.textDim} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-sm font-medium",
                  isActive 
                    ? `bg-white/10 ${theme.textHigh}` 
                    : `hover:bg-white/5 ${theme.textDim} hover:${theme.textHigh}`
                )}
              >
                <item.icon size={18} className={isActive ? theme.accent : ""} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center border border-white/20">
               <span className={theme.textHigh}>JS</span>
            </div>
            <div className="flex flex-col">
              <span className={clsx("text-xs font-semibold", theme.textHigh)}>John Smith</span>
              <span className={clsx("text-[10px] uppercase tracking-wider", theme.textDim)}>Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 lg:px-8 border-b border-asas-charcoal/10 dark:border-white/5 bg-asas-sand/50 dark:bg-[#08090A]/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-asas-charcoal dark:text-asas-sand border border-transparent hover:border-asas-silver/30 rounded-sm"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-display font-semibold text-lg lg:text-xl text-asas-charcoal dark:text-asas-sand tracking-tight">
              {navItems.find(item => pathname?.startsWith(item.href))?.label || "Overview"}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex relative w-64 group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-asas-charcoal/40 dark:text-asas-sand/40 group-focus-within:text-asas-gold transition-colors" />
              <input 
                type="text" 
                placeholder="Search OS..." 
                className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-asas-gold/50 rounded-sm py-1.5 pl-9 pr-4 text-sm text-asas-charcoal dark:text-asas-sand placeholder:text-asas-charcoal/40 dark:placeholder:text-asas-sand/40 outline-none transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] bg-black/10 dark:bg-white/10 text-asas-charcoal/50 dark:text-asas-sand/50 font-mono">⌘</kbd>
                <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] bg-black/10 dark:bg-white/10 text-asas-charcoal/50 dark:text-asas-sand/50 font-mono">K</kbd>
              </div>
            </div>

            <button className="relative p-2 text-asas-charcoal/70 dark:text-asas-sand/70 hover:text-asas-charcoal dark:hover:text-asas-sand transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-asas-copper border-2 border-asas-sand dark:border-[#08090A]" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE INNER PAGE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>

      </main>

    </div>
  );
}
