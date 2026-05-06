// src/modules/agents/components/AgentDashboard.tsx
'use client'
import { useEffect, useState } from 'react'

export function AgentDashboard({ agentId, agentName }: { agentId: string, agentName: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/agents/kpis?view=snapshot&agentId=${agentId}`)
      .then(r => r.json()).then(setData)
  }, [agentId])

  if (!data) return <div className="p-6 md:p-8 text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">Décryptage du profil...</div>

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-[#050505] border-y lg:border border-black/5 dark:border-white/5 lg:rounded-3xl lg:m-6 shadow-2xl">
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">{agentName} <span className="text-gray-500">I-Performance</span></h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Pipeline Liquidé</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{data.closed_deals} <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Protocoles</span></p>
        </div>
        <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Conversion Réussie</p>
          <p className="text-2xl font-extrabold text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] mt-2">{data.close_rate_pct}%</p>
        </div>
      </div>
    </div>
  )
}
