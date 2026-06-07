'use client'

import React from 'react';
import { 
  AlertTriangle, Clock, ShieldAlert, Activity, ArrowRight,
  Construction, CheckCircle2, XCircle
} from 'lucide-react';
import { clsx } from 'clsx';

const RISKS = [
  { id: 'RSK-01', project: 'Résidence EL YASMINE', type: 'Supply Chain', description: 'Retard de livraison ciment (Fournisseur X)', severity: 'high', status: 'active', delayImpact: '+14 jours' },
  { id: 'RSK-02', project: 'Résidence BAHIA', type: 'Weather', description: 'Intempéries prévues semaine prochaine', severity: 'medium', status: 'monitoring', delayImpact: '+3 jours' },
  { id: 'RSK-03', project: 'Résidence EL BAHAR', type: 'Compliance', description: 'Validation permis modifiée', severity: 'critical', status: 'active', delayImpact: 'Inconnu' },
];

export function DelaysRisksModule() {
  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-700 bg-transparent text-white pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400 uppercase font-bold tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Risk Engine Active</span>
             </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
             Delays & Risks Tracking
          </h1>
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-bold mt-2">Projection IA des retards potentiels et matrice des risques chantiers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#D4A64F] mb-4">Risques Actifs</h3>
            <span className="text-3xl font-display font-bold text-white">3</span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-red-500/20 relative overflow-hidden">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-4">Jours de retards projetés (Moyen)</h3>
            <span className="text-3xl font-display font-bold text-red-500">+8 Jours</span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-green-400 mb-4">Risques Mitigés ce mois</h3>
            <span className="text-3xl font-display font-bold text-white">12</span>
         </div>
      </div>
      
      <div className="flex-1 w-full bg-[#0A1829] rounded-2xl border border-white/5 flex flex-col p-6 overflow-hidden">
         <h3 className="text-sm font-bold text-white tracking-tight mb-4">Matrix des Risques</h3>
         <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {RISKS.map(risk => (
               <div key={risk.id} className="flex items-center gap-4 p-4 bg-[#051121] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                  <div className={clsx(
                     "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                     risk.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                     risk.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                     'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  )}>
                     <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-white truncate">{risk.description}</p>
                     <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-1">
                        {risk.project} • {risk.type}
                     </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-4 text-right">
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Impact</span>
                        <span className="text-xs font-mono font-bold text-red-400">{risk.delayImpact}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
