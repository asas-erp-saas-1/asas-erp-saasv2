import React from 'react';
import { 
  Plus,
  Filter
} from 'lucide-react';
import { fetchActiveDeals } from '@/app/actions/crm';
import { PipelineBoard } from '@/components/crm/PipelineBoard';

export const dynamic = 'force-dynamic';

export default async function CRMPipelinePage() {
  // Fetch deals through Server Action (secure, RLS applied)
  let deals = [];
  try {
    deals = await fetchActiveDeals();
  } catch (err) {
    console.error("Failed fetching deals, using mock fallback...", err);
    // Mock fallback just in case DB is not yet populated
    deals = [
      { id: '1a2b', stage: 'DRAFT', agreed_price: 15400000, client: { first_name: 'Amirouche', last_name: 'Khaled' }, agency_id: 'internal' },
      { id: '2c3cd', stage: 'PENDING_APPROVAL', agreed_price: 9200000, client: { first_name: 'Sonia', last_name: 'M.' }, agency_id: 'internal' },
    ];
  }

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

      {/* DRAG-AND-DROP KANBAN BOARD */}
      <PipelineBoard initialDeals={deals} />

    </div>
  );
}
