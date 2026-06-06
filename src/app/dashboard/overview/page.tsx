import React from 'react';
import { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { kernel } from '@/lib/kernel/core';
import { redirect } from 'next/navigation';
import { RoleDashboards } from '@/modules/dashboard/components/RoleDashboards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tableau de Bord Global — ASAS OS',
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
      <div className="flex flex-col gap-2 pb-6 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
               <div className="w-14 h-14 rounded-xl bg-asas-gold/10 border border-asas-gold/20 flex items-center justify-center shadow-[0_0_15px_rgba(212,166,79,0.15)]">
                   <LayoutDashboard className="h-6 w-6 text-asas-gold" />
               </div>
               Tableau de Bord Global <span className="text-white/20 mx-2 font-sans font-light">|</span> <span className="text-asas-gold">الداشبورد الشامل</span>
            </h1>
            <p className="text-[10px] font-bold text-white/50 mt-4 pl-[68px] uppercase tracking-widest">
              Vue {userRole} — Command Center des opérations, CRM et ERP.
            </p>
          </div>
          
          <div className="flex items-center gap-2 pl-[68px] sm:pl-0 mt-2 sm:mt-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ring-4 ring-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-green-400">Flux Synchronisé</span>
            </div>
          </div>
        </div>
      </div>

      <RoleDashboards role={userRole} metrics={metrics} events={recentEvents} />

    </div>
  );
}
