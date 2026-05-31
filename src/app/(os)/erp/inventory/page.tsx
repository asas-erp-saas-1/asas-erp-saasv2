import React from 'react';
import { 
  Building2, 
  MapPin, 
  Filter, 
  Plus, 
  Archive,
  Search,
  ArrowRight,
  CheckCircle2,
  Lock,
  Key
} from 'lucide-react';
import { clsx } from 'clsx';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export default async function ERPInventoryPage() {
  
  // Dummy data representing the structured database map: Project -> Unit
  const units = [
    { id: 'U-1001', project: 'Les Palmiers', type: 'F4', floor: 'RC', area: 120, price: 14500000, status: 'AVAILABLE' },
    { id: 'U-1002', project: 'Les Palmiers', type: 'F3', floor: '1st', area: 95, price: 11200000, status: 'RESERVED' },
    { id: 'U-1003', project: 'Les Palmiers', type: 'F4', floor: '1st', area: 120, price: 14800000, status: 'AVAILABLE' },
    { id: 'U-1004', project: 'Les Palmiers', type: 'Studio', floor: '2nd', area: 45, price: 5600000, status: 'AVAILABLE' },
    { id: 'U-1015', project: 'Les Palmiers', type: 'F3', floor: '2nd', area: 95, price: 11600000, status: 'VSP_SIGNED' },
    { id: 'V-001', project: 'Elite Villas - Zeralda', type: 'Villa', floor: '-', area: 450, price: 85000000, status: 'AVAILABLE' },
    { id: 'V-002', project: 'Elite Villas - Zeralda', type: 'Villa', floor: '-', area: 520, price: 92000000, status: 'SOLD' },
  ];

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
            className="w-full bg-transparent border border-asas-charcoal/10 dark:border-white/10 focus:border-asas-gold/50 rounded-sm py-1.5 pl-8 pr-4 text-xs text-asas-charcoal dark:text-asas-sand placeholder:text-asas-charcoal/40 dark:placeholder:text-asas-sand/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* INVENTORY TABLE MATRIX */}
      <div className="flex-1 overflow-auto border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/50 dark:bg-[#0F1113]/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-asas-charcoal/5 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-24">Unit ID</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-32">Status</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Project Name</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-24">Type</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 text-right w-24">Area (m²)</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 text-right w-32">Listing Price</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-asas-charcoal/5 dark:divide-white/5">
            {units.map((unit) => {
              
              let statusBadge = null;
              if (unit.status === 'AVAILABLE') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30"><CheckCircle2 size={10} /> Available</span>;
              } else if (unit.status === 'RESERVED') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30"><Lock size={10} /> Reserved</span>;
              } else if (unit.status === 'VSP_SIGNED') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"><Archive size={10} /> VSP Signed</span>;
              } else if (unit.status === 'SOLD') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-asas-charcoal/10 dark:bg-white/10 text-asas-charcoal/70 dark:text-asas-sand/70 border border-asas-charcoal/20 dark:border-white/20"><Key size={10} /> Sold</span>;
              }

              return (
                <tr 
                  key={unit.id} 
                  className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-asas-charcoal dark:text-asas-sand group-hover:text-asas-gold transition-colors">{unit.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       <Building2 size={14} className="text-asas-charcoal/40 dark:text-asas-sand/40" />
                       <span className="font-semibold text-asas-charcoal dark:text-asas-sand">{unit.project}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-asas-charcoal/80 dark:text-asas-sand/80">{unit.type} {unit.floor !== '-' ? `(${unit.floor})` : ''}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-xs text-asas-charcoal/70 dark:text-asas-sand/70">{unit.area}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-xs font-bold text-asas-charcoal dark:text-asas-sand">
                      {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(unit.price)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-asas-charcoal/40 dark:text-asas-sand/40 hover:text-asas-gold transition-colors">
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
