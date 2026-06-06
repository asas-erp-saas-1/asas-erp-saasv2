'use client'

import React, { useState } from 'react';
import { 
  Building2, Plus, Search, Filter, Layers, LayoutGrid, Calculator, BookOpen
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export function AccountingLedger() {
  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500 bg-transparent text-white pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5 relative z-10 w-full max-w-7xl mx-auto px-6">
        <div>
          <div className="flex items-center gap-2 mb-2 hidden sm:flex">
            <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] text-[#D4A64F] uppercase font-bold tracking-widest flex items-center gap-1">
               <BookOpen className="w-3 h-3" />
               <span>General Ledger Active</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display">
            Accounting Ledger
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4A64F] mt-2 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-asas-gold animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(212,166,79,0.6)]" />
            Oracle ERP Logic • Comptabilité Générale
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 shrink-0 bg-[#D4A64F] hover:bg-[#E0B96B] text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,166,79,0.3)] transition-all active:scale-95 border border-transparent outline-none">
             <Plus className="w-4 h-4" /> New Entry
           </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.05),_transparent_50%)]"></div>
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <BookOpen className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">Accounting Module Initialization</h2>
          <p className="text-xs font-medium text-white/50 leading-relaxed mb-8 max-w-sm">
            Full synchronization with Oracle General Ledger is pending final data mapping. General ledger, chart of accounts, and automated reconciliations will be available here.
          </p>
          <Link href="/dashboard/finance" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-2">
            Return to Treasury Command
          </Link>
        </div>
      </div>
    </div>
  )
}
