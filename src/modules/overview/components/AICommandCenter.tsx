'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react'

export function AICommandCenter() {
  const [priorityQueue, setPriorityQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/automation?view=priority_queue&limit=3')
        if (res.ok) {
           const data = await res.json()
           setPriorityQueue(data)
        }
      } catch (e: any) {
        import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(e, { context: 'AICommandCenter load' }))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const defaultInsights = [
    {
      type: 'opportunity',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      title: 'Opportunité de clôture',
      message: 'Le Moteur IA analyse les données du terrain en temps réel.'
    },
    {
      type: 'risk',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      title: 'Analyse Prédictive',
      message: 'Surveillance des risques opérationnels en cours... En attente de signaux.'
    },
    {
      type: 'optimization',
      icon: Sparkles,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      title: 'Optimisation Stratégique',
      message: 'Calibrage des prix du marché par rapport à l\'infrastructure courante.'
    }
  ]

  const insights = priorityQueue.length > 0 
    ? priorityQueue.slice(0, 3).map((item, idx) => {
        let typeInfo = defaultInsights[idx] || defaultInsights[0];
        if (!typeInfo) typeInfo = defaultInsights[0]!;
        if (item.priority === 'urgent' || item.priority === 'high') {
           typeInfo = defaultInsights[1]!;
        } else if (item.client_name?.includes('Invest')) {
           typeInfo = defaultInsights[0]!;
        }
        return {
           ...typeInfo,
           title: item.title || typeInfo.title,
           message: item.description || `Analyse du client ${item.client_name} - Priorité ${item.priority}`
        };
      })
    : defaultInsights;

  return (
    <div className="bg-gray-50 dark:bg-[#050505] rounded-[2rem] p-8 mt-6 text-gray-900 dark:text-white shadow-2xl relative overflow-hidden flex flex-col border border-black/5 dark:border-white/5 group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-extrabold mb-1 tracking-tight font-display text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <BrainCircuit strokeWidth={1.5} className="w-6 h-6" />
          </div>
          Cortex IA : Analyses Prédictives
        </h3>
        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
          Moteur d'intelligence ASAS v4.0. Traitement en temps réel des vecteurs de transaction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl p-5 hover:border-black/10 dark:border-white/10 hover:bg-[#0f0f0f] transition-all"
            >
               <div className="flex flex-col h-full">
                 <div className="flex items-center gap-3 mb-4">
                   <div className={`w-10 h-10 rounded-xl ${insight.bg} flex items-center justify-center`}>
                     <Icon className={`w-5 h-5 ${insight.color}`} strokeWidth={2} />
                   </div>
                   <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{insight.title}</h4>
                 </div>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-auto leading-relaxed">{insight.message}</p>
               </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
