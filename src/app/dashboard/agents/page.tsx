// src/app/dashboard/agents/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, TrendingDown, ChevronRight, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { AgentDashboard } from '@/modules/agents/components/AgentDashboard'

interface AgentRow {
  agentId:          string
  agentName:        string
  tier:             string
  rank:             number
  rankDelta:        number | null
  performanceScore: number
  closedDeals:      number
  activeDeals:      number
  totalRevenue:     number
  commissionEarned: number
  closingRatePct:   number
  avgDealSize:      number
}

const TIER_CONFIG: Record<string, { color: string; icon: string }> = {
  Elite:   { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: '👑' },
  Gold:    { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: '🥇' },
  Silver:  { color: 'text-gray-300 bg-gray-500/10 border-gray-500/20',   icon: '🥈' },
  Bronze:  { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',icon: '🥉' },
  Starter: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    icon: '⭐' },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n))
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={clsx('h-full rounded-full transition-colors', score >= 75 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : score >= 50 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : score >= 25 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]')}
        />
      </div>
      <span className={clsx('text-xs font-bold w-7 text-right drop-shadow-sm', score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-blue-400' : score >= 25 ? 'text-amber-400' : 'text-red-400')}>
        {Math.round(score)}
      </span>
    </div>
  )
}

export default function AgentsPage() {
  const [agents,     setAgents]    = useState<AgentRow[]>([])
  const [loading,    setLoading]   = useState(true)
  const [selectedId, setSelected]  = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/agents/kpis?view=rankings&limit=50')
        const data = await res.json()
        setAgents(data.rankings ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selected = agents.find(a => a.agentId === selectedId)

  return (
    <div className="flex flex-1 h-full bg-[#050505] overflow-hidden font-sans rounded-2xl shadow-2xl border border-white/5">
      {/* Left: rankings */}
      <div className={clsx('flex flex-col bg-[#050505] border-r border-white/5 overflow-hidden transition-all duration-300 shadow-2xl z-10', selectedId ? 'hidden lg:flex lg:w-1/2 xl:w-[45%]' : 'w-full')}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 shrink-0 bg-[#0A0A0A]">
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3 tracking-tight">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Users className="h-5 w-5 text-blue-400" /> 
             </div>
             Classement des Agents
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">{agents.length} agents actifs au total</p>
        </div>

        {/* Rankings table */}
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-[#171717] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
              <div className="w-20 h-20 bg-[#171717] rounded-full flex items-center justify-center mb-4">
                 <Users className="h-10 w-10 text-gray-400" />
              </div>
              <p className="font-extrabold text-white">Aucun agent trouvé</p>
              <p className="text-sm mt-1">Les données de classement n'ont pas pu être chargées.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-500 w-16 text-center">#</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-500">Agent</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-500 hidden md:table-cell">Score Performance</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-500 hidden lg:table-cell text-right">Transactions</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-500 hidden xl:table-cell text-right">Revenu</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-500 hidden lg:table-cell text-right">Conversion</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#050505]">
                <AnimatePresence>
                {agents.map((agent, i) => {
                  const tierCfg = TIER_CONFIG[agent.tier] ?? TIER_CONFIG['Starter']!
                  const isSelected = selectedId === agent.agentId;
                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={agent.agentId}
                      onClick={() => setSelected(isSelected ? null : agent.agentId)}
                      className={clsx('cursor-pointer transition-colors group relative', isSelected ? 'bg-[#171717]' : 'hover:bg-[#0A0A0A]')}
                    >
                      {/* Active indicator */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                      
                      {/* Rank */}
                      <td className="px-6 py-5 text-center">
                        <div className={clsx(
                          'h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm font-bold shadow-sm',
                          agent.rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-amber-700 text-white border-yellow-500/50 border shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                          agent.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white border-gray-400/50 border' :
                          agent.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white border-orange-500/50 border' :
                          'bg-[#171717] text-gray-500 border-white/10 border'
                        )}>
                          {agent.rank}
                        </div>
                      </td>

                      {/* Name + tier + delta */}
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1.5">
                          <p className={clsx("text-sm font-bold", isSelected ? 'text-blue-400' : 'text-white')}>{agent.agentName}</p>
                          <div className="flex items-center gap-2">
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide border', tierCfg.color)}>
                              {tierCfg.icon} {agent.tier}
                            </span>
                            {agent.rankDelta !== null && (
                              <span className={clsx('text-[10px] font-bold flex items-center gap-0.5', agent.rankDelta > 0 ? 'text-emerald-500' : agent.rankDelta < 0 ? 'text-red-500' : 'text-gray-500')}>
                                {agent.rankDelta > 0 ? <TrendingUp className="h-3 w-3" /> : agent.rankDelta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                {agent.rankDelta > 0 ? `+${agent.rankDelta}` : agent.rankDelta < 0 ? String(agent.rankDelta) : '–'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Score bar */}
                      <td className="px-4 py-5 hidden md:table-cell align-middle">
                        <ScoreBar score={agent.performanceScore} />
                      </td>

                      {/* Closed deals */}
                      <td className="px-4 py-5 text-right hidden lg:table-cell align-middle">
                         <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-white">{agent.closedDeals} conclues</span>
                            <span className="text-xs font-medium text-gray-500">{agent.activeDeals} en cours</span>
                         </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-5 text-right hidden xl:table-cell align-middle">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                           {fmt(agent.totalRevenue)} DZD
                        </span>
                      </td>

                      {/* Close rate */}
                      <td className="px-4 py-5 text-right hidden lg:table-cell align-middle">
                        <span className={clsx('text-xs font-extrabold drop-shadow-md', agent.closingRatePct >= 40 ? 'text-emerald-500' : agent.closingRatePct >= 20 ? 'text-blue-500' : 'text-gray-500')}>
                          {Math.round(agent.closingRatePct)}%
                        </span>
                      </td>

                      <td className="pr-6 align-middle text-right">
                        <ChevronRight className={clsx("h-5 w-5 transition-transform", isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-600 group-hover:text-gray-400')} />
                      </td>
                    </motion.tr>
                  )
                })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: agent detail */}
      {selectedId && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto bg-[#050505]">
          <div className="lg:hidden bg-[#0A0A0A] border-b border-white/5 px-6 py-4 sticky top-0 z-20 shadow-md">
            <button onClick={() => setSelected(null)} className="text-sm font-bold text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors">
               <ChevronRight className="h-4 w-4 rotate-180" /> Retour au Classement
            </button>
          </div>
          <div className="p-4 md:p-6 lg:scroll-mt-0">
             {selected && <AgentDashboard agentId={selectedId} agentName={selected.agentName} />}
          </div>
        </motion.div>
      )}
    </div>
  )
}
