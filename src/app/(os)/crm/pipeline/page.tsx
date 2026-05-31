import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  Filter,
  Plus,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { clsx } from 'clsx';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export default async function CRMPipelinePage() {
  
  // Pipeline stages based on State Machine logic
  const stages = [
    { id: 'NEW_LEAD', label: 'New Ingestion', count: 12 },
    { id: 'ROUTED', label: 'Routed (SLA Active)', count: 8 },
    { id: 'CONTACTED', label: 'Contacted', count: 24 },
    { id: 'NEGOTIATING', label: 'Negotiating', count: 6 },
    { id: 'WON', label: 'Won / Transferred to VSP', count: 3 }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-end justify-between pb-6 border-b border-asas-charcoal/10 dark:border-white/5 mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-asas-charcoal dark:text-asas-sand mb-2">Deal Pipeline</h1>
          <p className="text-sm text-asas-charcoal/60 dark:text-asas-sand/50 font-medium">
            Strict Lead Routing Engine & Negotiation Tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-asas-charcoal dark:bg-asas-sand text-asas-sand dark:text-asas-charcoal text-sm font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-90">
            <Plus size={16} />
            Ingest Lead
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-white/50 dark:bg-[#0F1113]/50 p-1 border border-asas-charcoal/10 dark:border-white/5 rounded-sm">
           <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-asas-charcoal dark:bg-white/10 text-asas-sand rounded-sm">All Pipelines</button>
           <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Elite Brokerage</button>
           <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">VSP Off-Plan</button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-8 h-8 rounded-sm bg-transparent border border-asas-charcoal/10 dark:border-white/10 text-asas-charcoal/70 dark:text-asas-sand/70 hover:border-asas-charcoal/30 dark:hover:border-white/30 transition-colors">
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* KANBAN BOARD (DENSE) */}
      <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col bg-white/30 dark:bg-[#0F1113]/30 border border-asas-charcoal/10 dark:border-white/5 rounded-sm h-full">
            
            {/* STAGE HEADER */}
            <div className="p-3 border-b border-asas-charcoal/10 dark:border-white/5 flex items-center justify-between bg-asas-charcoal/5 dark:bg-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-asas-charcoal/80 dark:text-asas-sand/80">{stage.label}</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-white/50 dark:bg-black/50 text-asas-charcoal dark:text-asas-sand border border-asas-charcoal/10 dark:border-white/10">
                {stage.count}
              </span>
            </div>

            {/* STAGE CARDS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
               {/* DUMMY CARD FOR VISUALIZATION */}
               <div className="p-3 bg-white dark:bg-[#151719] border border-asas-charcoal/10 dark:border-white/5 rounded-sm hover:border-asas-gold/50 cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-mono font-bold text-asas-charcoal/50 dark:text-asas-sand/50">LD-2094</span>
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  </div>
                  <h4 className="font-semibold text-asas-charcoal dark:text-asas-sand text-sm mb-1">Amirouche Khaled</h4>
                  <div className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60 mb-3 truncate">Looking for 4-Bed Villa (Budget: ~12M DZD)</div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-asas-charcoal/10 dark:border-white/5">
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-sm bg-asas-charcoal/5 dark:bg-white/5 border border-asas-charcoal/10 dark:border-white/10 flex items-center justify-center text-[9px] font-bold">
                           YB
                        </div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Y. Bougherra</span>
                     </div>
                     <MessageSquare size={12} className="text-asas-charcoal/40 dark:text-asas-sand/40 group-hover:text-asas-gold transition-colors" />
                  </div>
               </div>

               <div className="p-3 bg-white dark:bg-[#151719] border border-asas-charcoal/10 dark:border-white/5 rounded-sm hover:border-asas-gold/50 cursor-pointer transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-mono font-bold text-asas-charcoal/50 dark:text-asas-sand/50">LD-2095</span>
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </div>
                  <h4 className="font-semibold text-asas-charcoal dark:text-asas-sand text-sm mb-1">Sonia M.</h4>
                  <div className="text-xs text-asas-charcoal/60 dark:text-asas-sand/60 mb-3 truncate">F3 Off-Plan Interest (FB Form)</div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-asas-charcoal/10 dark:border-white/5">
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-sm bg-asas-charcoal/5 dark:bg-white/5 border border-asas-charcoal/10 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-red-500">
                           !
                        </div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-red-500 font-bold">Unassigned</span>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
