'use client'

import { useEffect, useState } from 'react'
import { motion, Variants } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Target, Activity, AlertCircle, RefreshCcw, Wallet, Briefcase, ArrowRight, ArrowUpRight, BarChart3, ShieldCheck, PieChart as PieChartIcon } from 'lucide-react'

const COLORS = ['#0D2824', '#C7A15A', '#081D33', '#B87333', '#0F1113', '#A7A9AC'];

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
        <div className="flex flex-col items-center justify-center py-32 text-gray-600 dark:text-gray-400">
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
        <div className="bg-white dark:bg-[#141618] border border-asas-silver/20 p-4 rounded-sm shadow-sm">
          <p className="text-asas-charcoal dark:text-asas-sand font-bold text-[10px] uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold font-mono" style={{ color: entry.color }}>
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
        <motion.div variants={item} className="bg-white dark:bg-[#141618] p-6 rounded-sm border border-asas-silver/20 shadow-sm relative overflow-hidden group hover:border-asas-gold/40 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24 text-asas-navy dark:text-asas-sand" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-sm bg-asas-navy/10 border border-asas-navy/20 text-asas-navy dark:text-asas-sand flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-[9px] font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-widest">Leads Actifs</h2>
          </div>
          <h3 className="text-4xl font-bold tracking-tighter text-asas-charcoal dark:text-asas-sand mb-2 relative z-10 font-mono">{metrics.activeLeads}</h3>
          <p className="text-[9px] uppercase tracking-widest font-bold text-asas-silver relative z-10">En cours de traitement</p>
        </motion.div>

        {/* Metric 2 */}
        <motion.div variants={item} className="bg-white dark:bg-[#141618] p-6 rounded-sm border border-asas-silver/20 shadow-sm relative overflow-hidden group hover:border-asas-gold/40 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Briefcase className="w-24 h-24 text-asas-emerald" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-sm bg-asas-emerald/10 border border-asas-emerald/20 text-asas-emerald flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="text-[9px] font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-widest">Transactions Clôturées</h2>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <h3 className="text-4xl font-bold tracking-tighter text-asas-charcoal dark:text-asas-sand mb-2 font-mono">{metrics.dealsClosed}</h3>
            <span className="text-[10px] font-bold text-asas-emerald bg-asas-emerald/10 px-2 py-1 rounded-sm mb-3">+{metrics.dealsWonPercentage}% réussite</span>
          </div>
          <p className="text-[9px] uppercase tracking-widest font-bold text-asas-silver relative z-10">Valeur Moy. {((metrics.avgDealSize || 0) / 1000000).toFixed(1)}M DZD</p>
        </motion.div>

        {/* Metric 3 */}
        <motion.div variants={item} className="bg-white dark:bg-[#141618] p-6 rounded-sm border border-asas-silver/20 shadow-sm relative overflow-hidden group hover:border-asas-gold/40 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-24 h-24 text-asas-gold" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-sm bg-asas-gold/10 border border-asas-gold/20 text-asas-gold flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-[9px] font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-widest">Taux de Conversion</h2>
          </div>
          <h3 className="text-4xl font-bold tracking-tighter text-asas-charcoal dark:text-asas-sand mb-2 relative z-10 font-mono">{metrics.conversionRate}%</h3>
          <p className="text-[9px] uppercase tracking-widest font-bold text-asas-silver relative z-10">Sur l'ensemble des leads qualifiés</p>
        </motion.div>
      </motion.div>

      {/* Charts section */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Chart 1 */}
        <motion.div variants={item} className="bg-white dark:bg-[#141618] border border-asas-silver/20 rounded-sm p-8 shadow-sm relative overflow-hidden xl:col-span-1">
             <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-asas-charcoal dark:text-asas-sand tracking-widest uppercase font-display">Évolution du CA (MTD)</h3>
                 <span className="px-3 py-1 bg-asas-emerald/10 text-asas-emerald rounded-sm text-[9px] uppercase tracking-widest font-bold">Croissance Stable</span>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D2824" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0D2824" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(167, 169, 172, 0.2)" vertical={false} />
                        <XAxis dataKey="month" stroke="currentColor" className="text-asas-silver text-[10px]" tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="currentColor" className="text-asas-silver text-[10px]" tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="rev" stroke="#0D2824" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </motion.div>

        {/* Chart 3 - Lead Sources */}
        <motion.div variants={item} className="bg-white dark:bg-[#141618] border border-asas-silver/20 rounded-sm p-8 shadow-sm relative overflow-hidden xl:col-span-1">
             <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-asas-charcoal dark:text-asas-sand tracking-widest uppercase font-display">Sources des Leads</h3>
                 <span className="px-3 py-1 bg-asas-navy/10 text-asas-navy dark:text-asas-sand rounded-sm text-[9px] uppercase tracking-widest font-bold">Pipeline Actuel</span>
             </div>
             <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={metrics.leadSourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="rgba(0,0,0,0)"
                        >
                            {metrics.leadSourceData?.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                 {metrics.leadSourceData?.map((entry: any, index: number) => (
                     <div key={`legend-${index}`} className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                         <span className="text-[9px] font-bold text-asas-silver uppercase tracking-widest">{entry.name}</span>
                     </div>
                 ))}
             </div>
        </motion.div>
        
        {/* Chart 2 */}
        <motion.div variants={item} className="bg-white dark:bg-[#141618] border border-asas-silver/20 rounded-sm p-8 shadow-sm relative overflow-hidden lg:col-span-2">
             <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-asas-charcoal dark:text-asas-sand tracking-widest uppercase font-display">Volume des Ventes</h3>
                 <span className="px-3 py-1 bg-asas-gold/10 text-asas-gold rounded-sm text-[9px] uppercase tracking-widest font-bold">Volume Actif</span>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.salesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(167, 169, 172, 0.2)" vertical={false} />
                        <XAxis dataKey="month" stroke="currentColor" className="text-asas-silver text-[10px]" tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="currentColor" className="text-asas-silver text-[10px]" axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="sales" fill="#C7A15A" radius={[2, 2, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </motion.div>
      </motion.div>

    </div>
  )
}

