// src/app/dashboard/overview/page.tsx
import { Metadata } from 'next'
import { AgentActionFeed } from '@/modules/workspace/components/AgentActionFeed'
import { LayoutDashboard } from 'lucide-react'
import { getMetricsData } from '@/actions/metricActions'
import { kernel } from '@/lib/kernel/core'
import { redirect } from 'next/navigation'

  export const metadata: Metadata = {
    title: 'Action Inbox — ASAS RE-OS',
    description: 'Unified action queue for all pending tasks and operations.',
  }

export default async function OverviewPage() {
  let metrics;
  let identity;
  let shouldRedirectTo: string | null = null;
  let unhandledError = null;

  try {
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

    // Load actionable tasks for ALL ROLES
    let mappedActions: any[] = [];
    try {
      // If admin/owner, maybe load ALL pending SLA breaches and approvals. For now, load tasks assigned to user.
      const taskFilters: any = { status: 'PENDING' };
      // Note: A true enterprise logic would check roles to load global approvals if admin.
      // But we just load PENDING items for the user or their role
      // For now, load everything to demonstrate inbox
      const tasks = await kernel.query('execution_inbox', { 
        filters: taskFilters,
        limit: 50,
        orderBy: { column: 'created_at', ascending: false }
      });

        // Assemble tasks mapping in-memory (O(1) lookup per item)
        mappedActions = (tasks || []).map((t: any) => {
           let type = t.priority === 'CRITICAL' ? 'urgent' : (t.priority === 'HIGH' ? 'whatsapp' : 'viewing');
           
           let timeStr = t.due_date ? new Date(t.due_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' }) : 'ASAP';
           if (t.sla_breach_at && new Date(t.sla_breach_at) < new Date()) {
             type = 'urgent';
             timeStr = 'En retard';
           }

           return {
             id: t.id,
             type: type,
             task: t.title,
             leadName: `Ref: ${t.reference_aggregate_type} [${t.reference_aggregate_id.substring(0,8)}]`,
             time: timeStr,
             phone: t.domain
           };
        });
      } catch (err) {
        console.error('Failed to fetch agent tasks:', err);
        // Fallback mappedActions remains empty array
      }

      return (
        <div className="w-full">
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-3 font-display uppercase">
               <div className="w-12 h-12 rounded-sm bg-asas-navy border border-asas-gold/20 flex items-center justify-center shadow-[0_0_20px_rgba(199,161,90,0.1)]">
                   <LayoutDashboard className="h-6 w-6 text-asas-gold" strokeWidth={1.5} /> 
               </div>
               Action Inbox <span className="text-asas-silver mx-2 opacity-50 font-sans font-light">|</span> صندوق مهام
            </h1>
            <p className="text-sm font-bold text-asas-silver uppercase tracking-widest pl-1">Centre de Commandement Exécutif</p>
          </div>
          <AgentActionFeed actions={mappedActions} />
        </div>
      );
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
    unhandledError = err;
  }

  if (unhandledError) {
    return (
      <div className="p-8 bg-red-900 border border-red-500 rounded text-black m-8">
        <h1 className="text-xl font-bold">Overview Page Unhandled Crash</h1>
        <pre className="mt-4 p-4 bg-black text-red-500 border border-red-500/50 rounded">{String(unhandledError.message)}</pre>
        <pre className="mt-4 text-xs opacity-50">{String((unhandledError as any)?.stack)}</pre>
      </div>
    );
  }
}
