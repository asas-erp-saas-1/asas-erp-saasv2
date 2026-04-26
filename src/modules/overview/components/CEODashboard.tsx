// src/modules/overview/components/CEODashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, Variants } from 'motion/react'
import { TrendingUp, Users, Target, Activity, AlertCircle, RefreshCcw, Wallet, Briefcase } from 'lucide-react'

export function CEODashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metrics')
      .then(r => r.json())
      .then(data => {
        setKpis(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load metrics", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <RefreshCcw className="w-8 h-8 animate-spin mb-4 text-[#1A2A4A]" />
        <p className="text-sm font-medium">Synchronisation des données...</p>
      </div>
    )
  }

  if (!kpis) return null;

  const cards = [
    {
      title: "Valeur du Pipeline",
      value: `${((kpis.pipelineWeightedValue || 0) / 1000000).toFixed(1)}M DZD`,
      subtitle: "Pondéré par probabilité",
      icon: Briefcase,
      color: "blue"
    },
    {
      title: "Revenus (MTD)",
      value: `${((kpis.revenueAccrualMTD || 0) / 1000000).toFixed(1)}M DZD`,
      subtitle: "Ce mois-ci",
      icon: TrendingUp,
      color: "emerald"
    },
    {
      title: "Taux de Conversion",
      value: `${kpis.conversionRate || 0}%`,
      subtitle: "Moyenne sur 30 jours",
      icon: Target,
      color: "indigo"
    },
    {
      title: "Trésorerie Actuelle",
      value: `${((kpis.cashBalance || 0) / 1000000).toFixed(1)}M DZD`,
      subtitle: `Mode: ${kpis.liquidityMode || 'Standard'}`,
      icon: Wallet,
      color: "purple"
    }
  ]

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="mt-8">
      {kpis.dataFreshness === 'stale' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">Données non synchronisées</h4>
            <p className="text-xs text-amber-700 mt-1">Le système financier est en cours de rapprochement. Certains chiffres peuvent dater de la dernière heure.</p>
          </div>
        </div>
      )}

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {cards.map((card, i) => (
          <motion.div key={i} variants={item} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-${card.color}-50 text-${card.color}-600`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{card.value}</h3>
            <p className="text-xs text-gray-400">{card.subtitle}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-gray-400" />
            Activité Récente
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Nouveaux leads ajoutés</p>
                <p className="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">+12 Leads</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Transaction conclue: Villa Atlas</p>
                <p className="text-xs text-gray-500">Aujourd'hui</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">45M DZD</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A2A4A] rounded-2xl p-6 text-white shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Actions Rapides</h3>
          <p className="text-white/60 text-sm mb-6">Accédez rapidement aux fonctions principales de gestion.</p>
          
          <div className="space-y-3 mt-auto">
            <a href="/dashboard/deals" className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium text-white">
              Gérer les transactions
              <span>→</span>
            </a>
            <a href="/dashboard/leads" className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium text-white">
              Vue d'ensemble des leads
              <span>→</span>
            </a>
            <a href="/dashboard/finance" className="w-full flex items-center justify-between px-4 py-3 bg-white text-[#1A2A4A] hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium">
              Rapprochement financier
              <span>→</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
