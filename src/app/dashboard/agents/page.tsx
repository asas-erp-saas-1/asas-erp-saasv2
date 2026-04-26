// src/app/dashboard/agents/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, TrendingDown, ChevronRight, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
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
  Elite:   { color: 'text-purple-700 bg-purple-100 border-purple-200', icon: '👑' },
  Gold:    { color: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: '🥇' },
  Silver:  { color: 'text-gray-600  bg-gray-100 border-gray-200',   icon: '🥈' },
  Bronze:  { color: 'text-orange-700 bg-orange-100 border-orange-200',icon: '🥉' },
  Starter: { color: 'text-blue-600  bg-blue-50 border-blue-200',    icon: '⭐' },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n))
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={clsx('h-full rounded-full transition-colors', score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-blue-500' : score >= 25 ? 'bg-amber-500' : 'bg-red-500')}
        />
      </div>
      <span className={clsx('text-xs font-bold w-7 text-right', score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-blue-600' : score >= 25 ? 'text-amber-600' : 'text-red-600')}>
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
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden font-sans">
      {/* Left: rankings */}
      <div className={clsx('flex flex-col bg-white border-r border-gray-100 overflow-hidden transition-all duration-300 shadow-sm z-10', selectedId ? 'hidden lg:flex lg:w-1/2 xl:w-[45%]' : 'w-full')}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 shrink-0 bg-white">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" /> 
             </div>
             Classement des Agents
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">{agents.length} agents actifs au total</p>
        </div>

        {/* Rankings table */}
        <div className="flex-1 overflow-y-auto w-full">
          {loading ? (
            <div className="space-y-2 p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <Users className="h-10 w-10 text-gray-300" />
              </div>
              <p className="font-bold text-gray-900">Aucun agent trouvé</p>
              <p className="text-sm mt-1">Les données de classement n'ont pas pu être chargées.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400 w-16 text-center">#</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Agent</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400 hidden md:table-cell">Score Performance</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400 hidden lg:table-cell text-right">Transactions</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400 hidden xl:table-cell text-right">Revenu</th>
                  <th className="px-4 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400 hidden lg:table-cell text-right">Conversion</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
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
                      className={clsx('cursor-pointer transition-colors group relative', isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50')}
                    >
                      {/* Active indicator */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />}
                      
                      {/* Rank */}
                      <td className="px-6 py-5 text-center">
                        <div className={clsx(
                          'h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm font-bold shadow-sm',
                          agent.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white border-yellow-200 border' :
                          agent.rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 border-gray-200 border' :
                          agent.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white border-orange-200 border' :
                          'bg-white text-gray-500 border-gray-100 border'
                        )}>
                          {agent.rank}
                        </div>
                      </td>

                      {/* Name + tier + delta */}
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1.5">
                          <p className={clsx("text-sm font-bold", isSelected ? 'text-blue-900' : 'text-gray-900')}>{agent.agentName}</p>
                          <div className="flex items-center gap-2">
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide border', tierCfg.color)}>
                              {tierCfg.icon} {agent.tier}
                            </span>
                            {agent.rankDelta !== null && (
                              <span className={clsx('text-[10px] font-bold flex items-center gap-0.5', agent.rankDelta > 0 ? 'text-emerald-600' : agent.rankDelta < 0 ? 'text-red-500' : 'text-gray-400')}>
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
                            <span className="text-sm font-bold text-gray-900">{agent.closedDeals} conclues</span>
                            <span className="text-xs font-semibold text-gray-400">{agent.activeDeals} en cours</span>
                         </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-5 text-right hidden xl:table-cell align-middle">
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                           {fmt(agent.totalRevenue)}
                        </span>
                      </td>

                      {/* Close rate */}
                      <td className="px-4 py-5 text-right hidden lg:table-cell align-middle">
                        <span className={clsx('text-xs font-extrabold', agent.closingRatePct >= 40 ? 'text-emerald-600' : agent.closingRatePct >= 20 ? 'text-blue-600' : 'text-gray-500')}>
                          {Math.round(agent.closingRatePct)}%
                        </span>
                      </td>

                      <td className="pr-6 align-middle text-right">
                        <ChevronRight className={clsx("h-5 w-5 transition-transform", isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-300 group-hover:text-gray-400')} />
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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto bg-gray-50">
          <div className="lg:hidden bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
            <button onClick={() => setSelected(null)} className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700">
               <ChevronRight className="h-4 w-4 rotate-180" /> Retour au Classement
            </button>
          </div>
          {selected && <AgentDashboard agentId={selectedId} agentName={selected.agentName} />}
        </motion.div>
      )}
    </div>
  )
}
