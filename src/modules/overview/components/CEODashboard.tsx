// src/modules/overview/components/CEODashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, Variants } from 'motion/react'
import { TrendingUp, Users, Target, Activity, AlertCircle, RefreshCcw, Wallet, Briefcase, ArrowRight, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

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
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <RefreshCcw className="w-10 h-10 animate-spin mb-6 text-blue-500" strokeWidth={1.5} />
        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Synchronisation OS en cours...</p>
      </div>
    )
  }

  if (!kpis) return null;

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
    <div className="mt-8 pb-12 overflow-hidden">
      {kpis.dataFreshness === 'stale' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-800 tracking-tight">Données non synchronisées</h4>
            <p className="text-xs text-amber-700/80 mt-1 font-medium">Le système financier est en cours de rapprochement. Certains chiffres secondaires datent de la dernière heure.</p>
          </div>
        </motion.div>
      )}

      {/* Main KPI Bento Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6"
      >
        {/* Card 1 */}
        <motion.div variants={item} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Briefcase className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Valeur du Pipeline</p>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1 font-display">{((kpis.pipelineWeightedValue || 0) / 1000000).toFixed(1)}M <span className="text-lg text-gray-400 font-medium">DZD</span></h3>
          <p className="text-xs text-gray-400 font-medium">Pondéré par probabilité</p>
        </motion.div>

        {/* Card 2 */}
        <motion.div variants={item} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Revenus (MTD)</p>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1 font-display">{((kpis.revenueAccrualMTD || 0) / 1000000).toFixed(1)}M <span className="text-lg text-gray-400 font-medium">DZD</span></h3>
          <p className="text-xs text-gray-400 font-medium">Ce mois-ci</p>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={item} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Target className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Taux de Conversion</p>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1 font-display">{kpis.conversionRate || 0}<span className="text-lg text-gray-400 font-medium">%</span></h3>
          <p className="text-xs text-gray-400 font-medium">Moyenne sur 30 jours</p>
        </motion.div>

        {/* Card 4 - Dark variant */}
        <motion.div variants={item} className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-[2rem] border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="w-32 h-32 transform rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 text-white border border-white/10 backdrop-blur-md group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                <Wallet className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Trésorerie Actuelle</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1 font-display">{((kpis.cashBalance || 0) / 1000000).toFixed(1)}M <span className="text-lg text-gray-500 font-medium">DZD</span></h3>
            <p className="text-xs text-gray-500 font-medium font-mono">MODE: {kpis.liquidityMode || 'Standard'}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Secondary Bento Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
      >
        {/* Activity Feed */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Pulse Actif
            </h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Voir tout <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="group flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-2xl transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center">
                    {i === 1 ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <Users className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{i === 1 ? 'Transaction conclue: Villa Atlas' : 'Nouveaux leads ajoutés via portail'}</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5 uppercase tracking-wide">Il y a {i + 1 * 2} heures</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  i === 1 ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' : 'bg-blue-100/50 text-blue-700 border border-blue-200/50'
                }`}>
                  {i === 1 ? '45M DZD' : '+12 Leads'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center - Deep Blue */}
        <div className="bg-gradient-to-br from-[#0A0A0A] to-[#171717] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col border border-gray-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="text-2xl font-extrabold mb-3 tracking-tight font-display">Hub de Commandement</h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
              Raccourcis vers vos workflows les plus critiques. Ne perdez pas une seconde.
            </p>
            
            <div className="space-y-3 mt-auto">
              <Link href="/dashboard/deals" className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl transition-all text-sm font-bold text-white group">
                <span className="flex items-center gap-3"><Briefcase className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" /> Gérer les transactions</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard/metrics" className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl transition-all text-sm font-bold text-white group">
                <span className="flex items-center gap-3"><BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" /> Analytiques avancés</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard/finance" className="w-full flex items-center justify-between px-5 py-4 bg-white text-black hover:bg-gray-100 rounded-2xl transition-all text-sm font-extrabold group mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <span className="flex items-center gap-3"><Wallet className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" /> Rapprochement financier</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
