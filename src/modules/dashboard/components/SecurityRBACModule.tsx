'use client'

import React from 'react';
import { 
  Plus, Search, ShieldAlert, Key, Users
} from 'lucide-react';

export function SecurityRBACModule() {
  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500 bg-transparent text-white pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5 relative z-10 w-full max-w-7xl mx-auto px-6">
        <div>
          <div className="flex items-center gap-2 mb-2 hidden sm:flex">
            <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-500 uppercase font-bold tracking-widest flex items-center gap-1">
               <ShieldAlert className="w-3 h-3" />
               <span>IAM & Security Core</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display">
            Security & RBAC
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 mt-2 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
            Zero-Trust Architecture • Rules Engine
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 shrink-0 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 border border-transparent outline-none">
             <Key className="w-4 h-4" /> Issue Key
           </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.05),_transparent_50%)]"></div>
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Users className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">Identity & Access Control</h2>
          <p className="text-xs font-medium text-white/50 leading-relaxed mb-8 max-w-sm">
            Configure system-wide privileges, organizational structure paths, password policies, and OAuth multi-tenant bindings. System is locked in production mode.
          </p>
        </div>
      </div>
    </div>
  )
}
