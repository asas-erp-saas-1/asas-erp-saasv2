'use client'

import React, { useState, useEffect } from 'react';
import { 
  Building2, DollarSign, RefreshCcw, CheckSquare, 
  Home, Activity, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Sun, Star, ChevronDown, Users, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { motion, Variants } from 'motion/react';

// Enterprise Static Data (Fallback & Demo)
const barData = [
  { name: 'Jun', ca: 20, enc: 15 },
  { name: 'Jul', ca: 25, enc: 18 },
  { name: 'Aug', ca: 22, enc: 16 },
  { name: 'Sep', ca: 38, enc: 25 },
  { name: 'Oct', ca: 40, enc: 28 },
  { name: 'Nov', ca: 30, enc: 22 },
  { name: 'Dec', ca: 32, enc: 24 },
  { name: 'Jan', ca: 35, enc: 26 },
  { name: 'Feb', ca: 38, enc: 28 },
  { name: 'Mar', ca: 42, enc: 30 },
  { name: 'Apr', ca: 38, enc: 28 },
  { name: 'May', ca: 48, enc: 35 },
];

const pieData = [
  { name: 'New Lead', value: 22.8, percent: '14%', color: '#3b82f6' },
  { name: 'Qualification', value: 31.2, percent: '19%', color: '#8b5cf6' },
  { name: 'Proposal', value: 45.6, percent: '28%', color: '#eab308' },
  { name: 'Negotiation', value: 36.7, percent: '23%', color: '#10b981' },
  { name: 'Closed Won', value: 26.1, percent: '16%', color: '#0ea5e9' },
];

const areaData = [
  { name: '22 May', val: 2 },
  { name: '23 May', val: 3 },
  { name: '24 May', val: 4 },
  { name: '25 May', val: 4.5 },
  { name: '26 May', val: 5 },
  { name: '27 May', val: 5.5 },
  { name: '28 May', val: 8.4 },
];

const upSparkline = [10, 20, 30, 45, 60, 80, 100];
const downSparkline = [100, 80, 60, 45, 30, 20, 10];

export function CommandCenterGlobal() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/metrics/board');
        const json = await res.json();
        if (json.data) {
           setMetrics(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch board metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full h-full flex flex-col space-y-4 sm:space-y-6 bg-transparent text-white pt-4 px-3 sm:px-2 md:px-0 pb-24 md:pb-8"
    >
      
      {/* 1. Enterprise Header Row */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 py-2 border-b border-white/5 pb-4 sm:pb-6">
        <div className="flex justify-between items-start">
          <div className="w-full">
             <div className="flex items-center justify-between sm:justify-start gap-2 mb-2 sm:mb-3">
               <span className="px-2 py-1 bg-white/5 border border-white/10 rounded uppercase text-[8px] sm:text-[9px] font-bold tracking-widest text-white/50 flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-asas-gold" />
                  Global Command Center
               </span>
               <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded uppercase text-[8px] sm:text-[9px] font-bold tracking-widest text-green-400">
                  SYSTEM ONLINE
               </span>
             </div>
             <h2 className="text-white/60 font-medium font-sans text-base sm:text-lg mb-0.5 sm:mb-1">
               Good Morning, <span className="text-white font-bold">Ahmed</span> 👋
             </h2>
             <p className="text-white/40 text-[10px] sm:text-xs font-mono uppercase tracking-widest">Enterprise Real Estate Operating System</p>
          </div>
          <div className="hidden md:block">
            <button className="flex items-center justify-between px-4 py-3 bg-[#0A1829] border border-white/10 rounded-xl text-sm font-bold shadow-sm hover:bg-[#0c1c2e] active:scale-95 transition-all min-w-[280px] min-h-[44px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-asas-gold/10 flex items-center justify-center border border-asas-gold/20">
                  <Building2 className="w-4 h-4 text-asas-gold" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-white">ASAS Holdings</span>
                  <span className="text-[10px] text-white/50 font-normal mt-0.5 tracking-wide uppercase">Consolidated Ledger</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Primary KPI Architecture (Mobile Horizontal Scroll / Grid on Desktop) */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory no-scrollbar grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <motion.div variants={itemVariants} className="min-w-[280px] sm:min-w-0 snap-center p-5 rounded-2xl bg-[#0A1829] border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Gross Revenue</span>
             <DollarSign className="w-4 h-4 text-[#D4A64F]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${((metrics?.revenue || 842000000) / 1000000).toFixed(1)}`}
              <span className="text-xs sm:text-sm font-sans tracking-normal uppercase ml-1.5 text-white/40">M DZD</span>
            </span>
            <div className="flex items-center gap-1.5 mt-2 bg-green-500/10 w-fit px-2 py-1 rounded-sm">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">+18.6%</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Cash Position */}
        <motion.div variants={itemVariants} className="min-w-[280px] sm:min-w-0 snap-center p-5 rounded-2xl bg-[#0A1829] border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Cash Position</span>
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center">
               182.7 <span className="text-xs sm:text-sm font-sans tracking-normal uppercase ml-1.5 text-white/40">M DZD</span>
            </span>
            <div className="flex items-center gap-1.5 mt-2 bg-green-500/10 w-fit px-2 py-1 rounded-sm">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">+15.2%</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Collections */}
        <motion.div variants={itemVariants} className="min-w-[280px] sm:min-w-0 snap-center p-5 rounded-2xl bg-[#0A1829] border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">A/R Collections</span>
             <RefreshCcw className="w-4 h-4 text-blue-400" />
          </div>
          <div>
             <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center">
               64.3 <span className="text-xs sm:text-sm font-sans tracking-normal uppercase ml-1.5 text-white/40">M DZD</span>
            </span>
            <div className="flex items-center gap-1.5 mt-2 bg-green-500/10 w-fit px-2 py-1 rounded-sm">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">+22.1%</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 4: Inventory Sold */}
        <motion.div variants={itemVariants} className="min-w-[280px] sm:min-w-0 snap-center p-5 rounded-2xl bg-[#0A1829] border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Units Sold</span>
             <Home className="w-4 h-4 text-purple-400" />
          </div>
          <div className="relative z-10">
             <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : metrics?.availableProperties || 124}
              <span className="text-xs sm:text-sm font-sans tracking-normal uppercase ml-1.5 text-white/40">Units</span>
            </span>
            <div className="flex items-center gap-1.5 mt-2 bg-red-500/10 w-fit px-2 py-1 rounded-sm">
              <ArrowDownRight className="w-3 h-3 text-red-400" />
              <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">-5.2%</span>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-10 sm:h-12 opacity-30 mt-4 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={downSparkline.map(v => ({ value: v }))}>
                <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 3. Middle Module (Charts & Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Revenue / Collections Combo */}
        <motion.div variants={itemVariants} className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-[300px] sm:h-[360px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Revenue & Collections Ledger</h3>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#D4A64F] rounded-full"></span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-white/50">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-white/50">Collections</span>
              </div>
            </div>
          </div>
          <div className="flex-1 -ml-4 sm:-ml-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap={4}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} tickFormatter={(v) => `${v}M`} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#051121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px'}} />
                <Bar dataKey="ca" fill="#D4A64F" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="enc" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Strategic Insight Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#101935] to-[#0A1829] border border-[#8b5cf6]/20 relative overflow-hidden flex flex-col h-auto sm:h-[360px]">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Star className="w-24 h-24 sm:w-32 sm:h-32 text-[#8b5cf6]" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] sm:text-[10px] uppercase font-bold tracking-widest text-[#8b5cf6] flex items-center gap-2">
                <Star className="w-3.5 h-3.5" /> Copilot Intelligence
              </span>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
               {/* Insight Card */}
               <div className="p-4 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 active:scale-[0.98] transition-all cursor-pointer">
                  <h4 className="text-xs font-bold text-white mb-2 leading-tight">Collections Optimizer</h4>
                  <p className="text-[10px] sm:text-xs text-white/60 leading-relaxed font-mono">
                    System detects 24% increase in on-time payments. AI recommends automating follow-up sequence.
                  </p>
               </div>
               
               {/* Insight Card */}
               <div className="p-4 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 active:scale-[0.98] transition-all cursor-pointer mt-auto">
                  <h4 className="text-xs font-bold text-white mb-2 leading-tight flex items-center gap-2">
                     <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Supply Chain Risk
                  </h4>
                  <p className="text-[10px] sm:text-xs text-white/60 leading-relaxed font-mono">
                    Marina Heights structural delivery delayed by 4 days. Probability of cascading schedule impact: 78%.
                  </p>
               </div>
            </div>
            
            <button className="w-full mt-4 py-3 sm:py-3 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 active:bg-[#8b5cf6]/30 text-[#c4b5fd] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#8b5cf6]/30 transition-all shadow-[0_0_15px_rgba(139,92,246,0.1)] active:scale-[0.98] min-h-[44px]">
              View AI Analysis Log
            </button>
          </div>
        </motion.div>
      </div>

      {/* 4. Bottom Tactical Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20 md:pb-4">
        {/* Project Pipeline Execution */}
        <motion.div variants={itemVariants} className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-auto sm:h-[320px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">Project Execution Ledger</h3>
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest font-bold">Immutable Pipeline Data</span>
          </div>
          <div className="flex-1 overflow-x-auto w-full custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left whitespace-nowrap min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Project Identity</th>
                  <th className="pb-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Completion Index</th>
                  <th className="pb-3 text-[9px] font-bold text-white/30 uppercase tracking-widest text-right">Inventory Target</th>
                  <th className="pb-3 text-[9px] font-bold text-white/30 uppercase tracking-widest text-right">Yield Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                { name: 'Aurora Towers Central', progress: 78, sold: '145/180', ca: '32.4 M' },
                { name: 'Azure Coastal Villas', progress: 62, sold: '98/160', ca: '21.7 M' },
                { name: 'Nova Tech District', progress: 41, sold: '56/120', ca: '14.3 M' },
              ].map((proj, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 active:bg-white/[0.05] sm:hover:bg-white/[0.02] transition-colors group cursor-pointer active:scale-[0.99]">
                  <td className="py-4 font-bold text-xs text-white group-hover:text-asas-gold transition-colors">{proj.name}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 sm:w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-white/50">{proj.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono text-xs text-white/70">{proj.sold}</td>
                  <td className="py-4 text-right font-mono font-bold text-sm text-white">{proj.ca} <span className="text-[9px] font-sans text-white/40">DZD</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </motion.div>

        {/* Sales Funnel Yield */}
        <motion.div variants={itemVariants} className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-[320px] sm:h-[320px]">
          <h3 className="text-sm font-bold text-white tracking-tight mb-4">Conversion Yield</h3>
          <div className="flex flex-col sm:flex-row flex-1 items-center mt-2 overflow-hidden gap-4 sm:gap-0">
            <div className="w-full sm:w-1/2 h-40 sm:h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} sm-innerRadius={55} sm-outerRadius={75} stroke="none" dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-mono font-bold text-white">162.4</span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 mt-1">M DZD</span>
              </div>
            </div>
            <div className="w-full sm:w-1/2 flex sm:flex-col justify-start gap-4 sm:space-y-3 pt-3 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-white/5 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
              {pieData.map((item, i) => (
                <div key={i} className="min-w-fit pr-4 sm:pr-0 pl-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{backgroundColor: item.color, color: item.color}}></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{item.name}</span>
                  </div>
                  <div className="pl-4">
                     <span className="text-[11px] font-mono text-white/40">{item.value}M <span className="ml-1 text-white/20">({item.percent})</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  )
}
