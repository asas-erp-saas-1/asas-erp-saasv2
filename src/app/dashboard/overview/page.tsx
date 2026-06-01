import React from 'react';
import { Metadata } from 'next';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Briefcase,
  Users,
  Building2,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import { clsx } from 'clsx';
import { createClient } from '@/lib/supabase/server';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { kernel } from '@/lib/kernel/core';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Global Overview — ASAS RE-OS',
  description: 'Unified Global ERP & CRM Intelligence tracking operational metrics.',
}

export default async function OverviewPage() {
  const supabase = await createClient();
  let identity;

  try {
    identity = await kernel.identity();
  } catch (error: any) {
    if (error?.message?.includes('Tenant isolation failure')) {
      redirect('/onboarding');
    } else {
      redirect('/login');
    }
  }

  // 1. Fetch real logic from Supabase DB
  
  // Pipeline Value (Sum of agreed_price for ongoing deals)
  const { data: pipelineDeals } = await supabase
    .from('deals')
    .select('agreed_price, stage')
    .neq('stage', 'CLOSED_WON')
    .neq('stage', 'CANCELLED');
    
  const pipelineValue = pipelineDeals?.reduce((sum, deal) => sum + Number(deal.agreed_price), 0) || 0;

  // Active Inventory Units
  const { count: availableUnitsCount } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'AVAILABLE');

  // New Leads (Clients with status NEW)
  const { count: newLeadsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'NEW');

  // Pending Contracts / VSP Signed
  const { count: pendingContractsCount } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'VSP_SIGNED');

  // Recent SLA / System Events from Event Bus
  const { data: recentEvents } = await supabase
    .from('event_bus')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fallback mock data for chart
  const chartData = [
    { name: 'Jan', revenue: 4000, leads: 240 },
    { name: 'Feb', revenue: 3000, leads: 139 },
    { name: 'Mar', revenue: 2000, leads: 980 },
    { name: 'Apr', revenue: 2780, leads: 390 },
    { name: 'May', revenue: 1890, leads: 480 },
    { name: 'Jun', revenue: 2390, leads: 380 },
    { name: 'Jul', revenue: 3490, leads: 430 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { 
      style: 'currency', 
      currency: 'DZD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-2 pb-4 border-b border-asas-charcoal/10 dark:border-white/5">
        <div className="flex items-start justify-between w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-3 font-display uppercase">
               <div className="w-12 h-12 rounded-sm bg-asas-navy border border-asas-gold/20 flex items-center justify-center shadow-[0_0_20px_rgba(199,161,90,0.1)]">
                   <LayoutDashboard className="h-6 w-6 text-asas-gold" strokeWidth={1.5} /> 
               </div>
               Platform Overview <span className="text-asas-silver mx-2 opacity-50 font-sans font-light">|</span> الداشبورد الشامل
            </h1>
            <p className="text-sm font-bold text-asas-silver uppercase tracking-widest pl-[60px] pt-1">
              Unified Global ERP & CRM Intelligence
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/50 dark:text-asas-sand/50">System Active</span>
            </div>
            <div className="px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
              <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/50 dark:text-asas-sand/50 block mb-0.5">YTD Revenue</span>
              <div className="text-sm font-semibold text-asas-gold">14.2M DZD</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI WIDGETS (CORE ERP/CRM LOGIC) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* INVENTORY WIDGET */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-asas-charcoal dark:text-white">
            <Building2 size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Active Inventory</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">
                  {availableUnitsCount || 0}
                </div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/50 dark:text-asas-sand/50 mt-1">Available Units</div>
              </div>
              <div className="flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                <ArrowUpRight size={14} className="mr-0.5" />
                Live
              </div>
            </div>
          </div>
        </div>

        {/* PIPELINE WIDGET */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-asas-charcoal dark:text-white">
            <Briefcase size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Pipeline Value</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-display font-bold text-asas-charcoal dark:text-asas-sand truncate max-w-[120px]">
                  {formatCurrency(pipelineValue)}
                </div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/50 dark:text-asas-sand/50 mt-1">Expected Revenue</div>
              </div>
              <div className="flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                <ArrowUpRight size={14} className="mr-0.5" />
                Active
              </div>
            </div>
          </div>
        </div>

        {/* LEADS WIDGET */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-asas-charcoal dark:text-white">
            <Users size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">New Leads</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">
                  {newLeadsCount || 0}
                </div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/50 dark:text-asas-sand/50 mt-1">Unassigned Queue</div>
              </div>
              <div className="flex items-center text-xs font-bold text-red-600 dark:text-red-400">
                <ArrowDownRight size={14} className="mr-0.5" />
                SLA Alert
              </div>
            </div>
          </div>
        </div>

        {/* CONTRACTS WIDGET */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-asas-gold/10 dark:bg-asas-gold/10 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 transition-opacity group-hover:opacity-30 text-asas-gold">
            <Scale size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-asas-gold">Contracts & VSP</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-asas-charcoal dark:text-asas-sand">
                  {pendingContractsCount || 0}
                </div>
                <div className="text-[11px] font-mono tracking-wide text-asas-charcoal/70 dark:text-asas-sand/70 mt-1">Pending Signatures</div>
              </div>
              <div className="flex items-center text-xs font-bold text-asas-gold">
                Action Req.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS LAYER & ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70">Revenue Trajectory (Accounting)</h3>
             <button className="text-xs font-mono border-b border-asas-charcoal/20 dark:border-white/20 text-asas-charcoal/50 dark:text-asas-sand/50 hover:text-asas-charcoal dark:hover:text-asas-sand transition-colors">Export DB</button>
          </div>
          <div className="flex-1 w-full min-h-0">
            <RevenueChart data={chartData} />
          </div>
        </div>

        {/* RECENT EXECUTIONS (MINI INBOX) */}
        <div className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm flex flex-col overflow-hidden max-h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70">Global Telemetry Log</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {recentEvents && recentEvents.length > 0 ? (
              recentEvents.map((event) => {
                let badgeColor = 'bg-asas-charcoal/20 dark:bg-white/20';
                let EventIcon = Clock;
                
                if (event.event_type.includes('DealStage')) {
                   badgeColor = 'bg-green-500';
                } else if (event.event_type.includes('Lead')) {
                   badgeColor = 'bg-asas-gold';
                }
                
                return (
                  <div key={event.id} className="flex gap-3">
                     <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${badgeColor}`} />
                     <div>
                        <p className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">
                          {event.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60">
                           {event.aggregate_type} - {event.aggregate_id.substring(0,8)}
                        </p>
                        <p className="text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                     </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-8">
                 <Clock size={24} className="mb-2" />
                 <p className="text-xs font-mono">No recent ecosystem events.</p>
              </div>
            )}
            
            {/* Fallback mock events for visual demonstration if DB is empty */}
            {(!recentEvents || recentEvents.length === 0) && (
              <>
                <div className="flex gap-3">
                   <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                   <div>
                      <p className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">Sales.DealStageAdvanced</p>
                      <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60">Deal #c9b1a moved to CONTRACT_PENDING.</p>
                      <p className="text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 mt-1">2 hours ago</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <div className="w-2 h-2 mt-1.5 rounded-full bg-asas-gold shrink-0" />
                   <div>
                      <p className="text-sm font-semibold text-asas-charcoal dark:text-asas-sand">CRM.LeadRegistered</p>
                      <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60">New VIP client onboarded (Lead #492).</p>
                      <p className="text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 mt-1">4 hours ago</p>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
