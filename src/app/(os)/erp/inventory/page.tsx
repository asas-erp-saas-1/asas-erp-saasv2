import React from 'react';
import { 
  Plus, 
  Search
} from 'lucide-react';
import { InventoryTable } from '@/components/erp/InventoryTable';
import { fetchProjectInventory } from '@/app/actions/erp';

export const dynamic = 'force-dynamic';

export default async function ERPInventoryPage() {
  
  let units = [];
  try {
    units = await fetchProjectInventory();
  } catch (err) {
    console.error("Failed to fetch inventory, using fallback:", err);
    // Mock Data Fallback
    units = [
      { id: 'U-1001', project_id: 'proj-1', unit_number: 'B2-401', type: 'F4', surface_area: 120, base_price: 14500000, status: 'AVAILABLE', technical_progress: 85, finishing_phase: 'Plastering & Finishes' },
      { id: 'U-1002', project_id: 'proj-1', unit_number: 'B2-402', type: 'F3', surface_area: 95, base_price: 11200000, status: 'RESERVED', technical_progress: 90, finishing_phase: 'Final Snagging' },
      { id: 'U-1003', project_id: 'proj-2', unit_number: 'VLA-07', type: 'Villa', surface_area: 450, base_price: 85000000, status: 'VSP_SIGNED', technical_progress: 35, finishing_phase: 'Masonry' },
    ];
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-end justify-between pb-6 border-b border-asas-charcoal/10 dark:border-white/5 mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-asas-charcoal dark:text-asas-sand mb-2">Inventory Ledger</h1>
          <p className="text-sm text-asas-charcoal/60 dark:text-asas-sand/50 font-medium">
            Project Units, State Tracking, and Availability Matrix.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-asas-charcoal dark:bg-asas-sand text-asas-sand dark:text-asas-charcoal text-sm font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-90">
            <Plus size={16} />
            New Unit
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-white/50 dark:bg-[#0F1113]/50 p-1 border border-asas-charcoal/10 dark:border-white/5 rounded-sm">
           <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-asas-charcoal dark:bg-white/10 text-asas-sand rounded-sm">All Inventory</button>
           <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Les Palmiers</button>
           <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-asas-charcoal/70 dark:text-asas-sand/70 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Elite Villas</button>
        </div>
        
        <div className="relative w-64 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-asas-charcoal/40 dark:text-asas-sand/40" />
          <input 
            type="text" 
            placeholder="Search Unit ID or Project..." 
            className="w-full bg-transparent border border-asas-charcoal/10 dark:border-white/10 focus:border-[#C7A15A]/50 rounded-sm py-1.5 pl-8 pr-4 text-xs text-asas-charcoal dark:text-asas-sand placeholder:text-asas-charcoal/40 dark:placeholder:text-asas-sand/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* INVENTORY TABLE MATRIX */}
      <InventoryTable units={units as any} />

    </div>
  );
}
