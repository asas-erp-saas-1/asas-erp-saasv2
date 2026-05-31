import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Briefcase,
  Users,
  Building2,
  Euro,
  Scale
} from 'lucide-react';
import { clsx } from 'clsx';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

const chartData = [
  { name: 'Jan', revenue: 4000, leads: 240 },
  { name: 'Feb', revenue: 3000, leads: 139 },
  { name: 'Mar', revenue: 2000, leads: 980 },
  { name: 'Apr', revenue: 2780, leads: 390 },
  { name: 'May', revenue: 1890, leads: 480 },
  { name: 'Jun', revenue: 2390, leads: 380 },
  { name: 'Jul', revenue: 3490, leads: 430 },
];

export default async function GlobalDashboardPage() {
  
  // Real ERP queries would go here
  // For UI preview, using placeholder logic structured for immediate integration
  
  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex items-end justify-between pb-4 border-b border-asas-charcoal/10 dark:border-white/5">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-asas-charcoal dark:text-asas-sand mb-2">Global Overview</h1>
          <p className="text-sm text-asas-charcoal/60 dark:text-asas-sand/50 font-medium">
            Unified cross-module performance metrics and volume tracking.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <div className="px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/50 dark:text-asas-sand/50">Fiscal Year</span>
            <div className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">FY 2026/27</div>
          </div>
          <div className="px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/50 dark:text-asas-sand/50">YTD Revenue</span>
            <div className="text-sm font-semibold text-asas-gold">14.2M DZD</div>
          </div>
        </div>
      </div>

      {/* KPI WIDGETS (DENSE 4-COL LAYOUT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* WIDGET 1 */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-asas-charcoal dark:text-white">
            <Building2 size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Active Inventory</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">104</div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/50 dark:text-asas-sand/50 mt-1">Available Units</div>
              </div>
              <div className="flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                <ArrowUpRight size={14} className="mr-0.5" />
                12%
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 2 */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-asas-charcoal dark:text-white">
            <Briefcase size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Pipeline Value</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">8.4M</div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/50 dark:text-asas-sand/50 mt-1">Expected Revenue</div>
              </div>
              <div className="flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                <ArrowUpRight size={14} className="mr-0.5" />
                4.2%
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 3 */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-asas-charcoal dark:text-white">
            <Users size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">New Leads</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">412</div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/50 dark:text-asas-sand/50 mt-1">This Month</div>
              </div>
              <div className="flex items-center text-xs font-bold text-red-600 dark:text-red-400">
                <ArrowDownRight size={14} className="mr-0.5" />
                2.1%
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 4 */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-asas-gold/10 dark:bg-asas-gold/10 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 transition-opacity group-hover:opacity-30 text-asas-gold">
            <Scale size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-gold">Legal & VSP</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">18</div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/70 dark:text-asas-sand/70 mt-1">Pending Contracts</div>
              </div>
              <div className="flex items-center text-xs font-bold text-asas-gold">
                Action Req.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70">Revenue Trajectory</h3>
             <button className="text-xs font-mono border-b border-asas-charcoal/20 dark:border-white/20 text-asas-charcoal/50 dark:text-asas-sand/50 hover:text-asas-charcoal dark:hover:text-asas-sand">View Ledger</button>
          </div>
          <div className="h-64 w-full">
            {/* Chart placeholder with proper CSS architecture */}
            <div className="w-full h-full border-l border-b border-asas-charcoal/10 dark:border-white/10 relative flex items-end p-2 gap-2">
               {/* Extremely simple visualizer since Recharts needs client component context, avoiding client component to keep it server-rendered unless strictly necessary */}
               <div className="flex-1 w-full h-full flex items-end gap-2 px-2">
                 {chartData.map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="w-full bg-asas-charcoal/20 dark:bg-white/20 group-hover:bg-asas-gold/50 transition-colors" style={{ height: `${(d.revenue / 4000) * 100}%` }}></div>
                      <span className="text-[10px] font-mono text-asas-charcoal/50 dark:text-asas-sand/50 mt-2">{d.name}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* RECENT EXECUTIONS (MINI INBOX) */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70">Recent SLA Activity</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="flex gap-3">
               <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
               <div>
                  <p className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">Contract Approved</p>
                  <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60">VSP #1092 was signed by CEO.</p>
                  <p className="text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 mt-1">2 hours ago</p>
               </div>
            </div>
            <div className="flex gap-3">
               <div className="w-2 h-2 mt-1.5 rounded-full bg-asas-gold shrink-0" />
               <div>
                  <p className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">Commission Release</p>
                  <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60">Pending approval from Finance Dir.</p>
                  <p className="text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 mt-1">4 hours ago</p>
               </div>
            </div>
            <div className="flex gap-3">
               <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
               <div>
                  <p className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">SLA Breach</p>
                  <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60">Lead Routing Engine timeout on Lead #492.</p>
                  <p className="text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 mt-1">Yesterday</p>
               </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
