import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ArrowRight, 
  FileSignature, 
  Mail, 
  MessageSquare,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  // Query pending tasks from the execution_inbox
  let tasks: any[] = [];
  try {
    tasks = await kernel.query('execution_inbox', {
      filters: { status: 'PENDING' },
      limit: 50,
      orderBy: { column: 'created_at', ascending: false }
    });
  } catch (error) {
    console.error("Failed to load inbox tasks:", error);
    // Mock data for UI preview if DB fails
    tasks = [
      {
        id: '1',
        task_type: 'APPROVAL_REQUIRED',
        title: 'Approve VSP Contract [REF-1092]',
        description: 'Client: Amirouche D. - Villa 4, Palm Jumeirah.',
        priority: 'CRITICAL',
        domain: 'Legal',
        sla_breach_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        task_type: 'COMMISSION_RELEASE',
        title: 'Release Commission for Deal #1002',
        description: 'Sales Agent: Y. Bougherra. 50% milestone reached.',
        priority: 'HIGH',
        domain: 'Finance',
        sla_breach_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date(Date.now() - 4000000).toISOString()
      },
      {
        id: '3',
        task_type: 'LEAD_FOLLOWUP',
        title: 'Hot Lead assigned via FB Ads',
        description: 'New Lead: Sophia K. (Campaign: Q3 Luxury)',
        priority: 'NORMAL',
        domain: 'CRM',
        sla_breach_at: new Date(Date.now() + 172800000).toISOString(),
        created_at: new Date().toISOString()
      }
    ];
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-end justify-between pb-6 border-b border-asas-charcoal/10 dark:border-white/5 mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-asas-charcoal dark:text-asas-sand mb-2">Execution Inbox</h1>
          <p className="text-sm text-asas-charcoal/60 dark:text-asas-sand/50 font-medium">
            Pending Actions & system-prompted decision gates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
            <span className="text-xs uppercase tracking-wider font-semibold text-asas-charcoal/70 dark:text-asas-sand/70 mr-3">Overdue</span>
            <span className="text-sm font-mono font-bold text-[#DC2626] dark:text-[#EF4444]">
              {tasks.filter(t => t.sla_breach_at && new Date(t.sla_breach_at) < new Date()).length}
            </span>
          </div>
          <div className="flex items-center px-3 py-1.5 bg-white/5 border border-asas-silver/20 dark:border-white/10 rounded-sm">
            <span className="text-xs uppercase tracking-wider font-semibold text-asas-charcoal/70 dark:text-asas-sand/70 mr-3">Pending</span>
            <span className="text-sm font-mono font-bold text-asas-charcoal dark:text-asas-sand">{tasks.length}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-asas-charcoal text-asas-sand dark:bg-asas-sand dark:text-asas-charcoal rounded-sm transition-opacity hover:opacity-90">
            <Filter size={14} />
            All Tasks
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-transparent border border-asas-charcoal/10 dark:border-white/10 text-asas-charcoal/70 dark:text-asas-sand/70 rounded-sm hover:border-asas-charcoal/30 dark:hover:border-white/30 transition-colors">
            Critical
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-transparent border border-asas-charcoal/10 dark:border-white/10 text-asas-charcoal/70 dark:text-asas-sand/70 rounded-sm hover:border-asas-charcoal/30 dark:hover:border-white/30 transition-colors">
            Approvals
          </button>
        </div>
        
        <div className="relative w-64 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-asas-charcoal/40 dark:text-asas-sand/40" />
          <input 
            type="text" 
            placeholder="Search execution references..." 
            className="w-full bg-transparent border border-asas-charcoal/10 dark:border-white/10 focus:border-asas-gold/50 rounded-sm py-1.5 pl-8 pr-4 text-xs text-asas-charcoal dark:text-asas-sand placeholder:text-asas-charcoal/40 dark:placeholder:text-asas-sand/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* INBOX TABLE (Mathematically dense data) */}
      <div className="flex-1 overflow-auto border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/50 dark:bg-[#0F1113]/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-asas-charcoal/5 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-12"></th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-32">Priority</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Execution Task</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-32">Domain</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-48">SLA Target</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 text-right w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-asas-charcoal/5 dark:divide-white/5">
            {tasks.map((task) => {
              const isOverdue = task.sla_breach_at && new Date(task.sla_breach_at) < new Date();
              const isCritical = task.priority === 'CRITICAL';
              const isHigh = task.priority === 'HIGH';
              
              return (
                <tr 
                  key={task.id} 
                  className={clsx(
                    "group transition-colors hover:bg-black/5 dark:hover:bg-white/5",
                    isOverdue && "bg-red-500/5 hover:bg-red-500/10"
                  )}
                >
                  <td className="px-4 py-4">
                    {task.task_type === 'APPROVAL_REQUIRED' ? (
                      <FileSignature size={16} className={clsx("text-asas-charcoal/50 dark:text-asas-sand/50", isOverdue && "text-red-500")} />
                    ) : task.task_type === 'LEAD_FOLLOWUP' ? (
                      <MessageSquare size={16} className="text-asas-charcoal/50 dark:text-asas-sand/50" />
                    ) : (
                      <Clock size={16} className="text-asas-charcoal/50 dark:text-asas-sand/50" />
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span 
                      className={clsx(
                        "inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border",
                        isCritical 
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" 
                          : isHigh 
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                            : "bg-asas-charcoal/5 dark:bg-white/5 text-asas-charcoal/70 dark:text-asas-sand/70 border-asas-charcoal/10 dark:border-white/10"
                      )}
                    >
                      {task.priority || 'NORMAL'}
                    </span>
                  </td>
                  <td className="px-4 py-4 max-w-md truncate">
                    <p className="font-semibold text-asas-charcoal dark:text-asas-sand mb-0.5">{task.title}</p>
                    <p className="text-xs text-asas-charcoal/60 dark:text-asas-sand/50 truncate">
                      {task.description || 'No description provided.'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 opacity-70">
                      <div className="w-1.5 h-1.5 rounded-full bg-asas-gold"></div>
                      <span className="font-mono text-[11px] uppercase tracking-wider">{task.domain || 'SYSTEM'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {task.sla_breach_at ? (
                      <div className="flex items-center gap-2">
                        {isOverdue && <AlertTriangle size={14} className="text-red-500" />}
                        <span className={clsx(
                          "font-mono text-[11px]",
                          isOverdue ? "text-red-600 dark:text-red-400 font-bold" : "text-asas-charcoal/70 dark:text-asas-sand/70"
                        )}>
                          {isOverdue ? 'BREACHED: ' : 'Target: '}
                          {new Date(task.sla_breach_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-asas-charcoal/50 dark:text-asas-sand/50">No SLA</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-asas-charcoal/5 hover:bg-asas-charcoal/10 dark:bg-white/5 dark:hover:bg-white/10 text-asas-charcoal dark:text-asas-sand transition-colors opacity-0 group-hover:opacity-100">
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-display font-semibold mb-1 text-asas-charcoal dark:text-asas-sand">Inbox Zero</h3>
            <p className="text-sm text-asas-charcoal/50 dark:text-asas-sand/50">All execution tasks and SLA targets are well within normal operating bounds.</p>
          </div>
        )}
      </div>

    </div>
  );
}
