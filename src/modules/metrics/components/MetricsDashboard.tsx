'use client'

import { useEffect, useState } from 'react'
import { motion, Variants } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, CartesianGrid } from 'recharts'
import { TrendingUp, Users, Target, Activity, AlertCircle, RefreshCcw, Wallet, Briefcase, ArrowRight, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react'

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metrics')
      .then(r => r.json())
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch((err) => {
        setLoading(false)
      })
  }, [])

  if (loading || !metrics) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <RefreshCcw className="w-10 h-10 animate-spin mb-6 text-blue-500" strokeWidth={1.5} />
          <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Chargement des analytiques...</p>
        </div>
      )
  }

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050505] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name === 'rev' ? (entry.value / 1000000).toFixed(1) + 'M DZD' : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <motion.div variants={item} className="bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24 text-blue-500" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Leads Actifs</h2>
          </div>
          <h3 className="text-4xl font-extrabold tracking-tighter text-white mb-2 relative z-10">{metrics.activeLeads}</h3>
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500 relative z-10">En cours de traitement</p>
        </motion.div>

        {/* Metric 2 */}
        <motion.div variants={item} className="bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Briefcase className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Transactions Clôturées</h2>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <h3 className="text-4xl font-extrabold tracking-tighter text-white mb-2">{metrics.dealsClosed}</h3>
            <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg mb-3">+{metrics.dealsWonPercentage}% réussite</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500 relative z-10">Valeur Moy. {((metrics.avgDealSize || 0) / 1000000).toFixed(1)}M DZD</p>
        </motion.div>

        {/* Metric 3 */}
        <motion.div variants={item} className="bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-24 h-24 text-purple-500" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Taux de Conversion</h2>
          </div>
          <h3 className="text-4xl font-extrabold tracking-tighter text-white mb-2 relative z-10">{metrics.conversionRate}%</h3>
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500 relative z-10">Sur l'ensemble des leads qualifiés</p>
        </motion.div>
      </motion.div>

      {/* Charts section */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Chart 1 */}
        <motion.div variants={item} className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-extrabold text-white tracking-tight">Évolution du CA (MTD)</h3>
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] uppercase tracking-widest font-bold">Croissance Stable</span>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </motion.div>

        {/* Chart 2 */}
        <motion.div variants={item} className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-extrabold text-white tracking-tight">Volume des Ventes</h3>
                 <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] uppercase tracking-widest font-bold">Volume Actif</span>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.salesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </motion.div>
      </motion.div>

    </div>
  )
}

