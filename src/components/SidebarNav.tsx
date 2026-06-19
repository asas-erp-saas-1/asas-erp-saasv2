'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  Building2, DollarSign, CheckSquare, BarChart2, Settings, 
  Users, Handshake, LayoutGrid, UserSquare2, Calendar as CalendarIcon, 
  Zap, Award, Megaphone, ShoppingCart, Receipt, Grid, Calculator, 
  Power, Clock, ShieldAlert, Cloud, Webhook, Star, Search
} from 'lucide-react';

const ICONS: Record<string, any> = {
  LayoutGrid, Users, Handshake, Building2, DollarSign, CheckSquare, BarChart2, Settings, 
  UserSquare2, CalendarIcon, Zap, Award, Megaphone, ShoppingCart, Receipt, Grid, Calculator, 
  Power, Clock, ShieldAlert, Cloud, Webhook, Star, Search
};

type SideBarNavProps = {
  navGroups: Array<{
    group: string;
    items: Array<{ href: string; label: string; iconName: string }>;
    roles?: string[];
  }>;
  role: string;
};

export function SidebarNav({ navGroups, role }: SideBarNavProps) {
  const pathname = usePathname();

  return (
    <div className="px-4 py-4 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
      {navGroups.map((navGroup) => {
         if (navGroup.roles && !navGroup.roles.includes(role)) return null;
         return (
           <div key={navGroup.group}>
             <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 px-4">{navGroup.group}</p>
             <nav className="flex flex-col gap-1">
               {navGroup.items.map(({ href, label, iconName }) => {
                 const Icon = ICONS[iconName] || LayoutGrid;
                 const isActive = pathname === href || pathname.startsWith(`${href}/`);
                 
                 return (
                 <Link key={href} href={href}
                   className={clsx(
                     "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all group relative overflow-hidden",
                     isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                   )}>
                   <div className={clsx(
                     "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-md bg-asas-gold transition-all duration-300 shadow-[0_0_10px_rgba(212,166,79,0.8)]",
                     isActive ? "h-1/2 opacity-100" : "h-0 opacity-0 group-hover:h-1/2 group-hover:opacity-100"
                   )}></div>
                   <Icon className={clsx("h-4 w-4 transition-colors", isActive ? "text-asas-gold" : "text-white/40 group-hover:text-asas-gold")} />
                   <span className={clsx("transition-transform tracking-wide", isActive ? "font-bold" : "group-hover:translate-x-1")}>{label}</span>
                 </Link>
               )})}
             </nav>
           </div>
         )
      })}
    </div>
  );
}
