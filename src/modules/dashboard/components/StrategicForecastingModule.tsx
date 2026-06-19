'use client'

import React from 'react';
import { 
  TrendingUp, TrendingDown, Target, BrainCircuit, Activity, 
  ArrowUpRight, ArrowDownRight, RefreshCcw, Calendar
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

const timelineData = [
  { name: 'Q1 2026', revenue: 42, target: 40, prediction: 42, cost: 28 },
  { name: 'Q2 2026', revenue: 48, target: 45, prediction: 49, cost: 31 },
  { name: 'Q3 2026', revenue: 55, target: 50, prediction: 57, cost: 35 },
  { name: 'Q4 2026', revenue: null, target: 60, prediction: 64, cost: 40 },
  { name: 'Q1 2027', revenue: null, target: 65, prediction: 69, cost: 42 },
  { name: 'Q2 2027', revenue: null, target: 70, prediction: 75, cost: 45 },
];

export function StrategicForecastingModule() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
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
      {/* 1. Header Row */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 py-2 border-b border-white/5 pb-4 sm:pb-6">
        <div>
          <div className="flex items-center justify-between sm:justify-start gap-2 mb-2 sm:mb-3">
             <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[8px] sm:text-[9px] text-purple-400 uppercase font-bold tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                <BrainCircuit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>AI Predictive Model</span>
             </div>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-sans font-bold text-white tracking-tight flex items-center gap-2 sm:gap-3">
             Strategic Forecasting
          </h1>
          <p className="text-white/40 text-[9px] sm:text-[11px] font-mono uppercase tracking-widest mt-1.5 sm:mt-3">24-Month Automated Financial Projection</p>
        </div>
        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 sm:mt-0">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 bg-[#0A1829] border border-white/10 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-white/5">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/50" /> 24 Months
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 bg-asas-gold hover:bg-[#E0B96B] text-[#051121] rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(212,166,79,0.3)] hover:shadow-[0_0_20px_rgba(212,166,79,0.5)]">
            <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden sm:block" /> Simulation
          </button>
        </div>
      </motion.div>

      {/* 2. Top KPIs */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory no-scrollbar grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-[#D4A64F]/30 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#D4A64F]">Projected ARR (2026)</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#D4A64F]/10 flex items-center justify-center border border-[#D4A64F]/20">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4A64F]" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">284 <span className="text-xs sm:text-sm font-sans tracking-normal uppercase text-white/40 ml-1">M DZD</span></span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2 bg-green-500/10 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">+12% vs Plan</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2 */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">Algorithm Confidence</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">94<span className="text-sm sm:text-xl font-sans text-white/40 ml-0.5">%</span></span>
            <div className="flex items-center gap-1 mt-2 sm:mt-3">
              <span className="px-1.5 sm:px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[8px] sm:text-[9px] rounded uppercase font-bold tracking-widest border border-indigo-500/30">Volumetric Output</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">CapEx Variance</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">-4.2<span className="text-sm sm:text-xl font-sans text-white/40 ml-0.5">%</span></span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2 bg-red-500/10 w-fit px-1.5 py-0.5 rounded">
              <ArrowDownRight className="w-3 h-3 text-red-400" />
              <span className="text-red-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Supply Inflation</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">Milestone Vector</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight flex items-center">Q4 Peak</span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
              <span className="text-white/40 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Yielding 60M Ceiling</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Main Chart */}
      <motion.div variants={itemVariants} className="p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-[400px] sm:h-[500px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Financial Trajectory Matrix</h3>
            <p className="text-[8px] sm:text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5 sm:mt-1">AI Augmented Enterprise Output</p>
          </div>
        </div>
        <div className="flex-1 w-full -ml-6 sm:-ml-4 mt-2 sm:mt-4">
          <ResponsiveContainer width={typeof window !== 'undefined' && window.innerWidth < 640 ? "130%" : "100%"} height="100%">
            <ComposedChart data={timelineData}>
              <CartesianGrid stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} tickFormatter={(v) => `${v}M`} />
              <Tooltip 
                 contentStyle={{backgroundColor: '#051121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace'}}
                 itemStyle={{fontSize: '12px'}}
                 labelStyle={{fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase'}}
              />
              <Legend wrapperStyle={{fontSize: '9px', textTransform: 'uppercase', color: '#64748b', fontFamily: 'monospace', paddingTop: '10px'}} />
              
              <Bar dataKey="cost" name="Expenditures" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 40} />
              <Bar dataKey="revenue" name="Confirmed Rev" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 40} />
              
              <Line type="monotone" dataKey="prediction" name="AI Target Rev" stroke="#D4A64F" strokeWidth={3} dot={{r: 4, fill: '#D4A64F', strokeWidth: 2, stroke: '#051121'}} />
              <Line type="monotone" dataKey="target" name="Base Target" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </motion.div>
  )
}
