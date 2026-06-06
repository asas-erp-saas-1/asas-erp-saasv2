// src/app/dashboard/invoices/page.tsx
'use client'

import { Receipt, Search, Plus, FileText, CheckCircle, Clock, ArrowUpRight } from 'lucide-react'

export default function InvoicesPage() {
  return (
    <div className="w-full flex-1 flex flex-col h-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="px-2 py-4 shrink-0 z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight font-display uppercase">
               <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.15)] hidden sm:flex">
                   <Receipt className="h-6 w-6 text-yellow-500" /> 
               </div>
               Facturation & Devis
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-yellow-500 mt-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              Oracle ERP Logic • Flux Financiers Clients
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-yellow-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="N° Facture, client..." 
                 className="w-full md:w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono shadow-inner"
               />
            </div>
            <button className="flex items-center justify-center gap-2 px-5 py-2 bg-yellow-500 text-[#051121] rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] whitespace-nowrap">
               <Plus className="h-4 w-4" /> Créer Facture
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        {[ 
          { label: "Brouillons", value: "12", change: "Devis / Facture", icon: FileText, cColor: "text-white/50", cBg: "bg-white/5" },
          { label: "En Attente de Paiement", value: "$450k", change: "28 Factures", icon: Clock, cColor: "text-yellow-500", cBg: "bg-yellow-500/10" },
          { label: "Payé (30j)", value: "$1.2M", change: "152 Factures", icon: CheckCircle, cColor: "text-green-400", cBg: "bg-green-500/10" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-[#0A1829]/60 backdrop-blur-md border border-white/5 flex flex-col justify-between group hover:border-yellow-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">{stat.label}</span>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-display font-bold text-white tracking-tight">{stat.value}</span>
              <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg ${stat.cBg} ${stat.cColor}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 p-8 rounded-3xl bg-[#0A1829]/60 backdrop-blur-md border border-white/5 mx-2 mt-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.05),_transparent_50%)]"></div>
        <div className="text-center relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <Receipt className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">Cycle de Facturation</h2>
          <p className="text-xs font-medium text-white/50 leading-relaxed mb-8">
            Le suivi des devis, facturations VSP clients et recouvrement Oracle est synchronisé avec le Grand Livre (GL).
          </p>
          <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-2">
            Synthèse Recouvrement <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
