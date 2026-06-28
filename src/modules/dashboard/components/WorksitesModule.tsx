'use client'

import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, MapPin, HardHat, Activity, Clock, Loader2
} from 'lucide-react';
import { ProjectCreateModal } from '@/app/dashboard/projects/ProjectCreateModal';
import { clsx } from 'clsx';
import Link from 'next/link';

export function WorksitesModule() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
     setLoading(true);
     try {
        const res = await fetch('/api/projects?limit=50');
        const json = await res.json();
        if (json.data) setProjects(json.data);
     } catch (err) {}
     setLoading(false);
  };

  useEffect(() => {
     fetchProjects();
  }, []);

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500 bg-transparent text-white pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5 relative z-10 w-full">
        <div>
          <div className="flex items-center gap-2 mb-2 hidden sm:flex">
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] text-blue-400 uppercase font-bold tracking-widest flex items-center gap-1">
               <HardHat className="w-3 h-3" />
               <span>Construction Ops Active</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display">
            Worksites Control
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mt-2 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
            Field Engine • {projects.length} Active Sites
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-6 py-2.5 shrink-0 bg-blue-500 hover:bg-blue-400 text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 border border-transparent outline-none">
             <Plus className="w-4 h-4" /> Open Site
           </button>
        </div>
      </div>

      {isModalOpen && (
         <ProjectCreateModal 
           onClose={() => setIsModalOpen(false)}
           onSuccess={() => {
              setIsModalOpen(false);
              fetchProjects();
           }}
         />
      )}

      {loading ? (
         <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
         </div>
      ) : projects.length === 0 ? (
         <div className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.05),_transparent_50%)]"></div>
           <div className="text-center relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
               <Building2 className="w-10 h-10 text-blue-400" />
             </div>
             <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">No Active Sites</h2>
             <p className="text-xs font-medium text-white/50 leading-relaxed mb-8 max-w-sm">
               Monitor real-time progress, daily logs, and sub-contractor activity across all active construction sites natively. Data is flowing from field supervisors.
             </p>
           </div>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((p) => (
               <Link href={`/dashboard/projects/${p.id}`} key={p.id} className="block group">
                  <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 hover:border-blue-500/30 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                     
                     <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                           <HardHat className="w-6 h-6" />
                        </div>
                        <span className={clsx(
                           "text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border",
                           p.status === 'planning' ? "bg-white/5 text-white/60 border-white/10" :
                           p.status === 'active' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                           p.status === 'completed' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                           "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                           {p.status}
                        </span>
                     </div>

                     <h3 className="text-xl font-bold text-white tracking-tight mb-1">{p.name}</h3>
                     <div className="flex items-center gap-2 text-white/50 text-xs mb-6">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{p.location || 'No location specified'}</span>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                              <span className="text-white/40">Construction Progress</span>
                              <span className="text-blue-400">{p.progress}%</span>
                           </div>
                           <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <div 
                                 className="h-full bg-gradient-to-r from-blue-600 to-blue-400 relative"
                                 style={{ width: `${p.progress}%` }}
                              >
                                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </Link>
            ))}
         </div>
      )}
    </div>
  )
}
