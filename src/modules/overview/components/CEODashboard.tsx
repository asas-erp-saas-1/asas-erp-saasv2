// src/modules/overview/components/CEODashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, Variants } from 'motion/react'
import { TrendingUp, Users, Target, Activity, AlertCircle, RefreshCcw, Wallet, Briefcase, ArrowRight, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const AICommandCenter = dynamic(() => import('./AICommandCenter').then(mod => mod.AICommandCenter), {
  ssr: false,
  loading: () => (
    <div className="bg-[#050505] rounded-[2rem] p-8 mt-6 border border-white/5 h-64 flex items-center justify-center">
      <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500/50" />
    </div>
  )
})

export function CEODashboard({ initialMetrics }: { initialMetrics?: any }) {
  const [kpis, setKpis] = useState<any>(initialMetrics || null)
  const [loading, setLoading] = useState(!initialMetrics)

  useEffect(() => {
    if (initialMetrics) return;
    fetch('/api/metrics')
      .then(r => r.json())
      .then(data => {
        setKpis(data)
        setLoading(false)
      })
      .catch((err) => {
        import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(err, { context: 'CEODashboard load' }));
        setLoading(false)
      })
  }, [initialMetrics])

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
        <motion.div variants={item} className="bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-white/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Briefcase className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Valeur du Pipeline</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1 font-display">{((kpis.pipelineWeightedValue || 0) / 1000000).toFixed(1)}M <span className="text-lg text-gray-600 font-medium">DZD</span></h3>
            <p className="text-xs text-gray-600 font-medium">Pondéré par probabilité</p>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div variants={item} className="bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-white/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Revenus (MTD)</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1 font-display">{((kpis.revenueAccrualMTD || 0) / 1000000).toFixed(1)}M <span className="text-lg text-gray-600 font-medium">DZD</span></h3>
            <p className="text-xs text-gray-600 font-medium">Ce mois-ci</p>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={item} className="bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-white/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Target className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Taux de Conversion</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1 font-display">{kpis.conversionRate || 0}<span className="text-lg text-gray-600 font-medium">%</span></h3>
            <p className="text-xs text-gray-600 font-medium">Moyenne sur 30 jours</p>
          </div>
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
        <div className="md:col-span-2 bg-[#050505] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Pulse Actif
            </h3>
            <button className="text-sm font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 group">
              Voir tout <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="flex flex-col gap-3 relative z-10">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="group flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 hover:border-white/10 rounded-2xl transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {i === 1 ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <Users className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{i === 1 ? 'Transaction conclue: Villa Atlas' : 'Nouveaux leads ajoutés via portail'}</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5 uppercase tracking-wide">Il y a {i + 1 * 2} heures</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  i === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {i === 1 ? '45M DZD' : '+12 Leads'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center - Deep Blue */}
        <div className="bg-[#050505] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col border border-white/5 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="text-2xl font-extrabold mb-3 tracking-tight font-display text-white">Hub de Commandement</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
              Raccourcis vers vos workflows les plus critiques. Ne perdez pas une seconde.
            </p>
            
            <div className="space-y-3 mt-auto">
              <Link href="/dashboard/deals" className="w-full flex items-center justify-between px-5 py-4 bg-[#0A0A0A] hover:bg-[#171717] border border-white/5 backdrop-blur-md rounded-2xl transition-all text-sm font-bold text-white group/link">
                <span className="flex items-center gap-3"><Briefcase className="w-4 h-4 text-gray-500 group-hover/link:text-blue-400 transition-colors" /> Gérer les transactions</span>
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard/metrics" className="w-full flex items-center justify-between px-5 py-4 bg-[#0A0A0A] hover:bg-[#171717] border border-white/5 backdrop-blur-md rounded-2xl transition-all text-sm font-bold text-white group/link">
                <span className="flex items-center gap-3"><BarChart3 className="w-4 h-4 text-gray-500 group-hover/link:text-blue-400 transition-colors" /> Analytiques avancés</span>
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard/finance" className="w-full flex items-center justify-between px-5 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl transition-all text-sm font-extrabold group/link mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <span className="flex items-center gap-3"><Wallet className="w-4 h-4 text-gray-500 group-hover/link:text-black transition-colors" /> Rapprochement financier</span>
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Intelligence Layer */}
      <AICommandCenter />
    </div>
  )
}
