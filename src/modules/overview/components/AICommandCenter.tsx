'use client'

import { motion } from 'motion/react'
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react'

export function AICommandCenter() {
  const insights = [
    {
      type: 'opportunity',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      title: 'Opportunité de clôture',
      message: 'Le client "Groupe Atlas" montre 82% de probabilité de signature cette semaine basé sur les interactions récentes.'
    },
    {
      type: 'risk',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      title: 'Risque de désistement détecté',
      message: 'Aucun contact avec "Investissements Sud" depuis 14 jours. Recommandation : appel de courtoisie immédiat.'
    },
    {
      type: 'optimization',
      icon: Sparkles,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      title: 'Optimisation de prix',
      message: 'Les données du marché suggèrent une sous-évaluation de 8% pour les lots commerciaux de la zone Nord.'
    }
  ]

  return (
    <div className="bg-[#050505] rounded-[2rem] p-8 mt-6 text-white shadow-2xl relative overflow-hidden flex flex-col border border-white/5 group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-extrabold mb-1 tracking-tight font-display text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <BrainCircuit strokeWidth={1.5} className="w-6 h-6" />
          </div>
          Cortex IA : Analyses Prédictives
        </h3>
        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
          Moteur d'intelligence ASAS v4.0. Traitement en temps réel des vecteurs de transaction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-[#0f0f0f] transition-all"
            >
               <div className="flex flex-col h-full">
                 <div className="flex items-center gap-3 mb-4">
                   <div className={`w-10 h-10 rounded-xl ${insight.bg} flex items-center justify-center`}>
                     <insight.icon className={`w-5 h-5 ${insight.color}`} strokeWidth={2} />
                   </div>
                   <h4 className="text-sm font-bold text-white leading-tight">{insight.title}</h4>
                 </div>
                 <p className="text-sm text-gray-400 mt-auto leading-relaxed">{insight.message}</p>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
