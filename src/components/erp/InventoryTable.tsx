'use client';

import React, { useState } from 'react';
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
  Key,
  HardHat,
  Settings2
} from 'lucide-react';
import { clsx } from 'clsx';
import type { UnitInventory } from '@/app/actions/erp';
import { UnitProgressPanel } from './UnitProgressPanel';

interface InventoryTableProps {
  units: UnitInventory[];
}

export function InventoryTable({ units: initialUnits }: InventoryTableProps) {
  const [units, setUnits] = useState<UnitInventory[]>(initialUnits);
  const [selectedUnit, setSelectedUnit] = useState<UnitInventory | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPanel = (unit: UnitInventory) => {
    setSelectedUnit(unit);
    setIsPanelOpen(true);
  };

  const handleProgressUpdate = (unitId: string, newProgress: number, newPhase: string) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, technical_progress: newProgress, finishing_phase: newPhase } : u));
    setIsPanelOpen(false);
  };

  return (
    <>
      <div className="flex-1 overflow-auto border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/50 dark:bg-[#0F1113]/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-asas-charcoal/5 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-24">Unit Ref</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-24">Type</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 w-40">Financial Status</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">Technical Progress</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 text-right w-32">Base Price</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-asas-charcoal/10 dark:divide-white/10">
            {units.map((unit) => {
              
              let statusBadge = null;
              if (unit.status === 'AVAILABLE') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[#0D2824]/10 text-[#0D2824] dark:bg-[#F2EDE4]/10 dark:text-[#F2EDE4] border border-[#0D2824]/30 dark:border-[#F2EDE4]/30"><CheckCircle2 size={12} /> Available</span>;
              } else if (unit.status === 'RESERVED') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[#B87333]/10 text-[#B87333] border border-[#B87333]/30"><Lock size={12} /> Reserved</span>;
              } else if (unit.status === 'VSP_SIGNED') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[#081D33]/10 text-[#081D33] dark:text-[#A7A9AC] border border-[#081D33]/30 dark:border-[#A7A9AC]/30"><Archive size={12} /> VSP Signed</span>;
              } else if (unit.status === 'SOLD') {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-asas-charcoal/10 dark:bg-white/10 text-asas-charcoal/70 dark:text-asas-sand/70 border border-asas-charcoal/20 dark:border-white/20"><Key size={12} /> Sold</span>;
              }

              return (
                <tr 
                  key={unit.id} 
                  className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-bold text-asas-charcoal dark:text-asas-sand group-hover:text-[#C7A15A] transition-colors">{unit.unit_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-asas-charcoal/80 dark:text-asas-sand/80 bg-white/50 dark:bg-black/50 px-2 py-1 rounded-sm border border-asas-charcoal/10 dark:border-white/10">{unit.type}</span>
                  </td>
                  <td className="px-4 py-4">
                    {statusBadge}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 w-full max-w-xs">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-asas-charcoal/60 dark:text-asas-sand/60">
                        <span>{unit.finishing_phase}</span>
                        <span className="font-bold text-asas-charcoal dark:text-asas-sand">{unit.technical_progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-asas-charcoal/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0D2824] dark:bg-[#C7A15A] rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${unit.technical_progress}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono text-xs font-bold text-asas-charcoal dark:text-asas-sand">
                      {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(unit.base_price)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => handleOpenPanel(unit)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-asas-charcoal text-asas-sand dark:bg-white/10 dark:text-asas-sand dark:hover:bg-white/20 hover:bg-asas-charcoal/90 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-wider border border-transparent dark:border-white/10"
                    >
                      <HardHat size={12} />
                      Tech Update
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {units.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-asas-charcoal/50 dark:text-asas-sand/50">
                  <div className="flex flex-col items-center justify-center">
                    <Building2 size={32} className="mb-4 opacity-50" />
                    <p className="text-sm font-semibold">No inventory units found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UnitProgressPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        unit={selectedUnit}
        onUpdate={handleProgressUpdate}
      />
    </>
  );
}
