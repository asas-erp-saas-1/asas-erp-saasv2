// src/app/dashboard/orchestration/page.tsx
import { Metadata } from 'next';
import OrchestratorWorkspace from './OrchestratorWorkspace';
import { LayoutGrid } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Orchestrateur & SLAs — ASAS RE-OS',
  description: 'Enterprise automatic scheduling and operational coordination workflows',
};

export default function OrchestrationPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 pb-6 border-b border-white/5 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 font-display uppercase">
           <div className="w-14 h-14 rounded-xl bg-asas-gold/10 border border-asas-gold/20 flex items-center justify-center shadow-[0_0_15px_rgba(212,166,79,0.15)]">
               <LayoutGrid className="h-6 w-6 text-asas-gold" strokeWidth={1.5} /> 
           </div>
           Moteur d'Orchestration <span className="text-white/20 mx-2 font-sans font-light">|</span> <span className="text-asas-gold">مركز التحكم الأساسي</span>
        </h1>
        <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest pl-[68px]">Autopilotage opérationnel & surveillance SLA</p>
      </div>
      <OrchestratorWorkspace />
    </div>
  );
}
