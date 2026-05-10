// src/modules/agents/components/AgentDashboard.tsx
'use client'
import { useEffect, useState } from 'react'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n))
}

export function AgentDashboard({ agentId, agentName }: { agentId: string, agentName: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/agents/kpis?view=snapshot&agentId=${agentId}`)
      .then(r => r.json()).then(setData)
  }, [agentId])

  if (!data) return <div className="p-6 md:p-8 text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">Décryptage du profil...</div>

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-[#050505] border-y lg:border border-black/5 dark:border-white/5 lg:rounded-3xl lg:m-6 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">{agentName} <span className="text-gray-500">I-Performance</span></h2>
        <span className="px-3 py-1 bg-gray-200 dark:bg-[#171717] rounded-full text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/5">
           Rang #{data.rank} • {data.tier}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2 relative z-10">Pipeline Liquidé</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1 relative z-10">{data.closedDeals} <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Protocoles</span></p>
        </div>
        
        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-2">Conversion Réussie</p>
          <p className="text-3xl font-extrabold text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] mt-1">{Math.round(data.closingRatePct)}%</p>
        </div>

        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Revenu Généré (Total)</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 drop-shadow-sm">{fmt(data.totalRevenue)} <span className="text-lg">DZD</span></p>
        </div>

        <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-[10px] uppercase font-bold tracking-widest text-purple-600 dark:text-purple-400 mb-2">Commissions (Est.)</p>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 drop-shadow-sm">{fmt(data.commissionEarned)} <span className="text-lg">DZD</span></p>
        </div>
      </div>
    </div>
  )
}
