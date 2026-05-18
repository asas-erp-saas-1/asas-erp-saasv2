// src/modules/agents/components/AgentDashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n))
}

export function AgentDashboard({ agentId, agentName }: { agentId: string, agentName: string }) {
  const [data, setData] = useState<any>(null)
  const [agreements, setAgreements] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadProfile = () => {
    fetch(`/api/agents/kpis?view=snapshot&agentId=${agentId}`)
      .then(r => r.json()).then(setData)
  }

  const loadAgreements = () => {
    fetch(`/api/agents/commissions?agentId=${agentId}`)
      .then(r => r.json()).then(d => setAgreements(d.unpaid || []))
  }

  useEffect(() => {
    loadProfile()
  }, [agentId])

  const openSettleModal = () => {
    loadAgreements()
    setShowModal(true)
  }

  const settle = async (agreementId: string, amount: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/command-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId: crypto.randomUUID(),
          aggregateId: agreementId,
          type: 'SETTLE_COMMISSION',
          expectedVersion: 1,
          payload: { agreementId, amount, agentId }
        })
      })
      if (!res.ok) throw new Error('Echec')
      loadProfile()
      loadAgreements()
    } catch (e) {
      alert('Erreur technique')
    } finally {
      setLoading(false)
    }
  }

  if (!data) return <div className="p-6 md:p-8 text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">Décryptage du profil...</div>

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-[#050505] border-y lg:border border-black/5 dark:border-white/5 lg:rounded-3xl lg:m-6 shadow-2xl relative">
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

        <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-purple-600 dark:text-purple-400 mb-2">Commissions à Payer</p>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 drop-shadow-sm">{fmt(data.commissionOutstanding)} <span className="text-lg">DZD</span></p>
            {data.commissionEarned > 0 && (
              <p className="text-xs text-purple-500 mt-2 font-medium">Déjà versé : {fmt(data.commissionEarned)} DZD</p>
            )}
          </div>
          {data.commissionOutstanding > 0 && (
            <button onClick={openSettleModal} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors w-full">
              Régler Commission
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-black/5 dark:border-white/5">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Détail des Commissions (En Attente)</h3>
              <p className="text-sm text-gray-500 mt-1">Solder les accords pour {agentName}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {agreements.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune commission en attente.</p>
              ) : (
                <div className="space-y-4">
                  {agreements.map((a) => (
                    <div key={a.agreement_id} className="p-4 border border-black/5 dark:border-white/5 rounded-xl bg-gray-50 dark:bg-[#111111] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Transaction #{a.deal_id.slice(0,6)}</p>
                        <p className="text-xs text-gray-500 mt-1">Reste à payer : <span className="font-bold text-gray-800 dark:text-gray-200">{a.outstanding_balance.toLocaleString()} DZD</span></p>
                      </div>
                      <button 
                        disabled={loading}
                        onClick={() => settle(a.agreement_id, a.outstanding_balance)}
                        className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 text-xs font-bold rounded-lg disabled:opacity-50"
                      >
                        Valider Pmt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-black/5 dark:border-white/5 bg-gray-50 dark:bg-[#050505] flex justify-end">
              <button disabled={loading} onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-[#171717] hover:bg-gray-300 dark:hover:bg-[#262626] text-gray-900 dark:text-white text-sm font-bold rounded-lg transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

