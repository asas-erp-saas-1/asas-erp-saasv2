// src/app/dashboard/overview/page.tsx
import { Metadata } from 'next'
import { CEODashboard } from '@/modules/overview/components/CEODashboard'
import { AgentActionFeed } from '@/modules/workspace/components/AgentActionFeed'
import { LayoutDashboard } from 'lucide-react'
import { getMetricsData } from '@/actions/metricActions'
import { kernel } from '@/lib/kernel/core'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Overview — ASAS RE-OS',
  description: 'Executive overview dashboard',
}

export default async function OverviewPage() {
  let metrics;
  let identity;
  let shouldRedirectTo: string | null = null;

  try {
    metrics = await getMetricsData();
    identity = await kernel.identity();
  } catch (error: any) {
    const errorMsg = error?.message || '';
    if (errorMsg.includes('Tenant isolation failure')) {
      shouldRedirectTo = '/onboarding';
    } else {
      shouldRedirectTo = '/login';
    }
  }

  if (shouldRedirectTo) {
    redirect(shouldRedirectTo);
  }

  // Fallback to prevent crash if redirect fails or is in progress
  if (!identity) {
    return null;
  }

  if (identity.role === 'agent') {
    let mappedActions: any[] = [];
    try {
      const tasks = await kernel.query('tasks', { 
        filters: { assigned_to: identity!.userId, status: 'pending' },
        limit: 20,
        orderBy: { column: 'due_date', ascending: true }
      });

      mappedActions = await Promise.all((tasks || []).map(async (t: any) => {
         let leadName = 'Tâche Interne';
         let phone = '';
         let type = t.priority === 'urgent' ? 'urgent' : (t.priority === 'high' ? 'whatsapp' : 'viewing');
         
         if (t.lead_id) {
           const leads = await kernel.query<any>('leads', { filters: { id: t.lead_id }, limit: 1 });
           if (leads && leads[0] && leads[0].client_id) {
              const client = await kernel.query<any>('clients', { filters: { id: leads[0].client_id }, limit: 1 });
              if (client && client[0]) {
                 leadName = client[0].full_name;
                 phone = client[0].phone || '';
              }
           }
         } else if (t.deal_id) {
           const deals = await kernel.query<any>('deals', { filters: { id: t.deal_id }, limit: 1 });
           if (deals && deals[0]) {
              leadName = `Deal #${deals[0].id.substring(0,8)}`;
              const clients = await kernel.query<any>('clients', { filters: { id: deals[0].client_id }, limit: 1 });
              if (clients && clients[0]) {
                 leadName = clients[0].full_name;
                 phone = clients[0].phone || '';
              }
           }
         }

         let timeStr = t.due_date ? new Date(t.due_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' }) : 'ASAP';
         if (t.due_date && new Date(t.due_date) < new Date()) {
           type = 'urgent';
           timeStr = 'En retard';
         }

         return {
           id: t.id,
           type: type,
           task: t.title,
           leadName: leadName,
           time: timeStr,
           phone: phone
         };
      }));
    } catch (err) {
      console.error('Failed to fetch agent tasks:', err);
      // Fallback mappedActions remains empty array
    }

    return (
      <div className="w-full">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-3 font-display">
             <div className="w-12 h-12 rounded-sm bg-asas-navy border border-asas-gold/20 flex items-center justify-center shadow-[0_0_20px_rgba(199,161,90,0.1)]">
                 <LayoutDashboard className="h-6 w-6 text-asas-gold" strokeWidth={1.5} /> 
             </div>
             Mon Espace <span className="text-asas-silver mx-2 opacity-50 font-sans font-light">|</span> المساحة الخاصة بي
          </h1>
          <p className="text-sm font-bold text-asas-silver uppercase tracking-widest pl-1">Tableau de bord opérationnel</p>
        </div>
        <AgentActionFeed actions={mappedActions} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-3 font-display uppercase">
           <div className="w-12 h-12 rounded-sm bg-asas-navy border border-asas-gold/20 flex items-center justify-center shadow-[0_0_20px_rgba(199,161,90,0.1)]">
               <LayoutDashboard className="h-6 w-6 text-asas-gold" strokeWidth={1.5} /> 
           </div>
           Vue d'ensemble <span className="text-asas-silver mx-2 opacity-50 font-sans font-light">|</span> نظرة عامة
        </h1>
        <p className="text-sm font-bold text-asas-silver uppercase tracking-widest pl-1">Centre de commandement exécutif</p>
      </div>
      <CEODashboard initialMetrics={metrics} />
    </div>
  )
}
