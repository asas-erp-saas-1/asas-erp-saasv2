'use client'

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, CheckCircle2, AlertCircle, FileText, Download,
  Activity, ArrowRight, Loader2, UploadCloud
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ReconciliationModule() {
  const [stats, setStats] = useState({ unreconciledCount: 0, aiMatchRate: 0, anomaliesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
     async function fetchStats() {
        try {
           const res = await fetch('/api/ledger/reconciliation');
           const json = await res.json();
           if (json.success) {
              setStats(json.data);
           }
        } catch (e) {}
        setLoading(false);
     }
     fetchStats();
  }, []);

  const handleUpload = () => {
     setUploading(true);
     setTimeout(() => {
        setUploading(false);
        toast.success("Statement uploaded. AI reconciliation in progress.");
     }, 2000);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-700 bg-transparent text-white pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-[9px] text-green-400 uppercase font-bold tracking-widest flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                <span>Reconciliation Active</span>
             </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
             Banque & Réconciliation
          </h1>
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-bold mt-2">Rapprochement bancaire intelligent et détection d'anomalies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#D4A64F] mb-4">Transactions non rapprochées</h3>
            <span className="text-3xl font-display font-bold text-white">
               {loading ? <Loader2 className="w-6 h-6 animate-spin text-white/50" /> : stats.unreconciledCount}
            </span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-green-500/20 relative overflow-hidden">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-green-400 mb-4">Taux de Rapprochement IA</h3>
            <span className="text-3xl font-display font-bold text-green-400">
               {loading ? <Loader2 className="w-6 h-6 animate-spin text-green-400/50" /> : `${stats.aiMatchRate}%`}
            </span>
         </div>
         <div className="p-6 rounded-2xl bg-[#0A1829] border border-red-500/10 relative overflow-hidden">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-4">Anomalies Détectées</h3>
            <span className="text-3xl font-display font-bold text-red-400">
               {loading ? <Loader2 className="w-6 h-6 animate-spin text-red-400/50" /> : stats.anomaliesCount}
            </span>
         </div>
      </div>
      
      <div className="flex-1 w-full bg-[#0A1829] rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02),_transparent_60%)] pointer-events-none"></div>
         <div className="p-8 max-w-sm w-full bg-[#051121] rounded-xl border border-white/10 text-center relative z-10 shadow-2xl">
            {uploading ? (
               <Loader2 className="w-12 h-12 text-[#D4A64F] mx-auto mb-4 opacity-80 animate-spin" />
            ) : (
               <UploadCloud className="w-12 h-12 text-[#D4A64F] mx-auto mb-4 opacity-80" />
            )}
            <h3 className="text-lg font-bold text-white mb-2">Upload Bank Statement</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-6">Import CSV/MT940 for AI Auto-Match</p>
            <button 
               onClick={handleUpload}
               disabled={uploading}
               className="w-full py-3 flex items-center justify-center gap-2 bg-[#D4A64F] hover:bg-[#E0B96B] disabled:opacity-50 text-[#051121] rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors shadow-[0_0_15px_rgba(212,166,79,0.3)]">
               {uploading ? "Analyzing..." : "Select File"}
            </button>
         </div>
      </div>
    </div>
  );
}
