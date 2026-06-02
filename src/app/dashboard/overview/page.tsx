import React from 'react';
import { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { kernel } from '@/lib/kernel/core';
import { redirect } from 'next/navigation';
import { RoleDashboards } from '@/modules/dashboard/components/RoleDashboards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hub Opérationnel — ASAS RE-OS',
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

  // 1. Core Profile & Role identification
  const { data: profiles } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', identity.userId);
  
  const userRole = profiles?.[0]?.role || 'agent';

  // 2. Fetch specific metrics based on role capability
  let metrics: any = {};
  
  if (userRole === 'owner' || userRole === 'manager' || userRole === 'admin') {
    // Pipeline Value (Sum of agreed_price for ongoing deals)
    const { data: pipelineDeals } = await supabase
      .from('deals')
      .select('agreed_price, status')
      .neq('status', 'won')
      .neq('status', 'lost');
      
    metrics.pipelineValue = pipelineDeals?.reduce((sum, deal) => sum + Number(deal.agreed_price), 0) || 0;

    // Active Inventory Units
    const { count: availableUnitsCount } = await supabase
      .from('units')
      .select('*', { count: 'exact', head: true })
      .in('status', ['available', 'AVAILABLE']);
    metrics.availableUnitsCount = availableUnitsCount;

    // New Leads (Clients with status NEW)
    const { count: newLeadsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
      // .eq('status', 'NEW'); // If client status existed, currently mapping general count
    metrics.newLeadsCount = newLeadsCount;

    // Pending Contracts / VSP Signed
    const { count: pendingContractsCount } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    metrics.pendingContractsCount = pendingContractsCount;

  } else {
    // Agent Specific Metrics
    const { count: myDealsCount } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', identity.userId);
    metrics.myDealsCount = myDealsCount;

    const { data: myDeals } = await supabase
      .from('deals')
      .select('agreed_price')
      .eq('assigned_to', identity.userId)
      .neq('status', 'won')
      .neq('status', 'lost');
    metrics.myPipelineValue = myDeals?.reduce((sum, deal) => sum + Number(deal.agreed_price), 0) || 0;

    metrics.myNewLeads = 0; // Update when pipeline assigned leads mapping exists
    
    const { count: todayTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      // mock task criteria
      .eq('priority', 'high');
    metrics.todayTasks = todayTasks;

    const { count: wonDealsThisMonth } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'won')
      .eq('assigned_to', identity.userId);
    metrics.wonDealsThisMonth = wonDealsThisMonth;
  }

  // Recent SLA / System Events from Event Bus (Fallback to empty mapping if pure table doesn't exist)
  let recentEvents: any[] = [];
  try {
    const { data: sysEvents } = await supabase
      .from('sys_audit_vault') // from the initial schema
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sysEvents) {
      recentEvents = sysEvents.map(e => ({
         id: e.id,
         event_type: e.operation_type,
         aggregate_type: 'System Vault',
         aggregate_id: e.id,
         created_at: e.created_at
      }));
    }
  } catch(e) {}

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-4 border-b border-asas-charcoal/10 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-3 font-display uppercase">
               <div className="w-10 h-10 rounded-sm bg-asas-navy border border-asas-gold/20 flex items-center justify-center shadow-[0_0_20px_rgba(199,161,90,0.1)]">
                   <LayoutDashboard className="h-5 w-5 text-asas-gold" strokeWidth={1.5} /> 
               </div>
               Hub Opérationnel <span className="text-asas-silver mx-2 opacity-50 font-sans font-light">|</span> الداشبورد الشامل
            </h1>
            <p className="text-[10px] font-bold text-asas-silver uppercase tracking-widest pl-[52px] pt-1">
              Vue {userRole} — Unified Global ERP / CRM Intelligence
            </p>
          </div>
          
          <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-asas-gold animate-pulse shadow-[0_0_10px_rgba(199,161,90,0.8)]"></div>
              <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-asas-charcoal/50 dark:text-asas-sand/50">Flux Synchronisé</span>
            </div>
          </div>
        </div>
      </div>

      <RoleDashboards role={userRole} metrics={metrics} events={recentEvents} />

    </div>
  );
}
