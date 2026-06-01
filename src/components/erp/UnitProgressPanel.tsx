'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardHat, 
  Save, 
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import type { UnitInventory } from '@/app/actions/erp';
import { updateUnitTechnicalProgress } from '@/app/actions/erp';

interface UnitProgressPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitInventory | null;
  onUpdate: (unitId: string, progress: number, phase: string) => void;
}

const PHASES = [
  'Foundation',
  'Masonry',
  'Plumbing & Electrical',
  'Plastering & Finishes',
  'Final Snagging',
  'Handover Ready'
];

export function UnitProgressPanel({ isOpen, onClose, unit, onUpdate }: UnitProgressPanelProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when panel opens
  useEffect(() => {
    if (unit && isOpen) {
      setProgress(unit.technical_progress);
      setPhase(unit.finishing_phase);
    }
  }, [unit, isOpen]);

  if (!isOpen || !unit) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // In reality, this agency ID would come from session or context.
      await updateUnitTechnicalProgress(unit.id, progress, phase, 'internal-agency');
      onUpdate(unit.id, progress, phase);
    } catch (err) {
      console.error("Failed to update technical progress", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={clsx(
        "fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-asas-sand dark:bg-[#0F1113] border-l border-asas-charcoal/10 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-asas-charcoal/10 dark:border-white/5 bg-asas-charcoal/5 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#0D2824]/10 dark:bg-white/5 border border-[#0D2824]/20 dark:border-white/10 flex items-center justify-center text-[#0D2824] dark:text-[#C7A15A]">
              <HardHat size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-asas-charcoal dark:text-asas-sand">Technical Update</h2>
              <p className="text-xs font-mono text-asas-charcoal/60 dark:text-asas-sand/60">UNIT: {unit.unit_number}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-asas-charcoal/60 dark:text-asas-sand/60 hover:text-asas-charcoal dark:hover:text-asas-sand bg-white/50 dark:bg-black/50 rounded-sm border border-asas-charcoal/10 dark:border-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* ISOLATION WARNING */}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm text-blue-800 dark:text-blue-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed font-medium">
              You are updating the <strong>Technical State</strong>. Financial status (VSP, Reservation) is strictly isolated and managed by the Commercial/Finance department.
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-asas-charcoal/80 dark:text-asas-sand/80">
              Current Construction Phase
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PHASES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={clsx(
                    "px-3 py-2 text-xs font-semibold text-left border rounded-sm transition-colors flex items-center justify-between",
                    phase === p 
                      ? "bg-[#0D2824] border-[#0D2824] text-white dark:bg-white/10 dark:border-[#C7A15A] dark:text-[#C7A15A]" 
                      : "bg-white/50 dark:bg-black/20 border-asas-charcoal/10 dark:border-white/10 text-asas-charcoal/70 dark:text-asas-sand/70 hover:border-asas-charcoal/30 dark:hover:border-white/30"
                  )}
                >
                  <span className="truncate">{p}</span>
                  {phase === p && <CheckCircle2 size={14} className="shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-asas-charcoal/80 dark:text-asas-sand/80">
                Detailed Completion (%)
              </label>
              <span className="font-mono text-xl font-bold text-[#0D2824] dark:text-[#C7A15A]">{progress}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-asas-charcoal/10 dark:bg-white/10 rounded-sm appearance-none cursor-pointer accent-[#0D2824] dark:accent-[#C7A15A]"
            />
            <div className="flex justify-between text-[10px] font-mono text-asas-charcoal/40 dark:text-asas-sand/40 uppercase tracking-widest">
              <span>0%</span>
              <span>Sub-Structure</span>
              <span>Super-Structure</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-asas-charcoal/80 dark:text-asas-sand/80">
              Site Notes & Approvals (Optional)
            </label>
            <textarea 
              rows={4}
              placeholder="e.g. Awaiting municipality inspection on electrical conduits..."
              className="w-full bg-white/50 dark:bg-black/20 border border-asas-charcoal/10 dark:border-white/10 rounded-sm p-3 text-sm text-asas-charcoal dark:text-asas-sand placeholder:text-asas-charcoal/40 dark:placeholder:text-asas-sand/40 outline-none focus:border-[#C7A15A] transition-colors resize-none"
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-asas-charcoal/10 dark:border-white/5 bg-asas-charcoal/5 dark:bg-white/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-asas-charcoal/20 dark:border-white/20 rounded-sm text-sm font-semibold uppercase tracking-wider text-asas-charcoal dark:text-asas-sand hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-[#0D2824] hover:bg-[#0D2824]/90 dark:bg-[#C7A15A] dark:hover:bg-[#C7A15A]/90 dark:text-[#0F1113] text-white rounded-sm text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Save size={16} />
                Save Progress
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
}
