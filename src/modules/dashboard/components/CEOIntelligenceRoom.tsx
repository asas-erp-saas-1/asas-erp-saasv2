'use client'

import React, { useState, useEffect } from 'react';
import { 
  Building2, DollarSign, Target, TrendingUp, AlertOctagon, 
  BrainCircuit, Activity, ArrowUpRight, ArrowDownRight, 
  ShieldAlert, Download, Star, ChevronDown, Crosshair, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { motion, Variants } from 'motion/react';

export function CEOIntelligenceRoom() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/metrics/ceo');
        const json = await res.json();
        if (json.data) {
           setMetrics(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch CEO metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const treasuryData = metrics?.treasuryData || [];
  const riskData = metrics?.riskData || [];
  const departmentData = metrics?.departmentData || [];

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
      
      {/* 1. Header Row */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 py-2 border-b border-white/5 pb-4 sm:pb-6">
        <div>
          <div className="flex items-center justify-between sm:justify-start gap-2 mb-2 sm:mb-3">
             <span className="px-2 py-1 bg-asas-gold/10 border border-asas-gold/20 rounded text-[8px] sm:text-[9px] text-asas-gold uppercase font-bold tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(212,166,79,0.1)]">
                <BrainCircuit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Executive Intelligence AI Active</span>
             </span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-sans font-bold text-white tracking-tight flex items-center gap-2 sm:gap-3">
             CEO Intelligence Room
          </h1>
          <p className="text-white/40 text-[9px] sm:text-[11px] font-mono uppercase tracking-widest mt-1.5 sm:mt-3">Global Strategic Overview & Decision Matrix</p>
        </div>
        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 sm:mt-0">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 bg-[#0A1829] border border-white/10 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-white/5">
            Q2 2026 Forecast <ChevronDown className="w-3 h-3 text-white/50 ml-1 sm:ml-2" />
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 bg-green-500 hover:bg-green-600 text-black rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            <Download className="w-3.5 h-3.5 hidden sm:block" /> Board Report
          </button>
        </div>
      </motion.div>

      {/* 2. Top Strategic KPIs */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory no-scrollbar grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Global Business Health */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-5 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-[#D4A64F]/30 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#D4A64F]">Business Health Score</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#D4A64F]/10 flex items-center justify-center border border-[#D4A64F]/20">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4A64F]" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics?.businessHealth}<span className="text-sm sm:text-lg font-sans text-white/30 ml-0.5">{loading ? '' : '/100'}</span>
            </span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2 bg-green-500/10 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">+2.1 pts vs target</span>
            </div>
          </div>
          <div className="h-1 bg-white/5 mt-4 sm:mt-5 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-asas-gold to-green-500 rounded-full shadow-[0_0_10px_rgba(212,166,79,0.5)]" style={{ width: `${metrics?.businessHealth || 0}%` }}></div>
          </div>
        </motion.div>

        {/* KPI 2: Enterprise Value */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-5 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">Portfolio AUM</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (metrics?.portfolioAum / 1000000).toFixed(1)} <span className="text-xs sm:text-sm font-sans tracking-normal uppercase text-white/40 ml-1">{loading ? '' : 'M DZD'}</span>
            </span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2 bg-green-500/10 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">+14.2% YoY Growth</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Treasury Runway */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-5 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">Treasury Runway</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics?.treasuryRunway} <span className="text-xs sm:text-sm font-sans tracking-normal uppercase text-white/40 ml-1">{loading ? '' : 'Months'}</span>
            </span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2 bg-green-500/10 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">+2 mo since Q1</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 4: Margin */}
        <motion.div variants={itemVariants} className="min-w-[240px] sm:min-w-0 snap-center p-4 sm:p-5 rounded-2xl bg-[#0A1829] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">Net Profit Margin</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-center">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics?.profitMargin}<span className="text-sm sm:text-lg font-sans text-white/30 ml-0.5">{loading ? '' : '%'}</span>
            </span>
            <div className="flex items-center gap-1 mt-1.5 sm:mt-2 bg-red-500/10 w-fit px-1.5 py-0.5 rounded">
              <ArrowDownRight className="w-3 h-3 text-red-500" />
              <span className="text-red-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">-0.8% vs target</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Middle Core Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        
        {/* Treasury Projection Area Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-[300px] sm:h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Enterprise Cash Flow Forecast Model</h3>
              <p className="text-[8px] sm:text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5 sm:mt-1">Projected Liquidity Index up to Q4 2026</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-asas-gold rounded-full shadow-[0_0_5px_rgba(212,166,79,0.5)]"></span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-white/50">Liquidity Trajectory</span>
              </div>
            </div>
          </div>
          <div className="flex-1 -mx-4 sm:-mx-2 -mb-2 mt-2 sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={treasuryData}>
                <defs>
                  <linearGradient id="colorTreasury" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A64F" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#D4A64F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} tickFormatter={(v) => `${v}M`} />
                <Tooltip contentStyle={{backgroundColor: '#051121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '12px'}} />
                <Area type="monotone" dataKey="val" stroke="#D4A64F" strokeWidth={3} fillOpacity={1} fill="url(#colorTreasury)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Recommendations Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0A1829] to-[#040C17] border border-asas-gold/20 flex flex-col h-auto sm:h-[400px] relative overflow-hidden group hover:border-asas-gold/40 transition-colors">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_top_right,_rgba(212,166,79,0.15),_transparent_70%)] pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
              <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-asas-gold" /> AI Strategic Insights
            </h3>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
          </div>
          
          <div className="flex-1 flex flex-col gap-2.5 sm:gap-3 overflow-y-auto no-scrollbar pr-1 sm:pr-2 relative z-10">
             {/* Insight 1 */}
             <div className="p-3 sm:p-4 rounded-xl border border-white/5 bg-white/5 active:bg-white/10 sm:hover:bg-white/10 transition-colors cursor-pointer group/card mt-1 sm:mt-2">
                <div className="flex items-start gap-2.5 sm:gap-3">
                   <div className="mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center shrink-0 border border-green-500/20">
                      <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                   </div>
                   <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-white mb-1.5 sm:mb-2 leading-tight group-hover/card:text-asas-gold transition-colors">Pricing Sequence Override</h4>
                      <p className="text-[9px] sm:text-[10px] text-white/50 font-mono leading-relaxed">Demand saturation in Northern sector yields 14% delta. AI calibrating +2.5% unit appreciation.</p>
                      <span className="text-[8px] sm:text-[9px] text-[#D4A64F] font-bold mt-2 sm:mt-3 uppercase tracking-widest block group-hover/card:underline">Execute Parameter &rarr;</span>
                   </div>
                </div>
             </div>

             {/* Insight 2 */}
             <div className="p-3 sm:p-4 rounded-xl border border-white/5 bg-white/5 active:bg-white/10 sm:hover:bg-white/10 transition-colors cursor-pointer group/card mt-auto">
                <div className="flex items-start gap-2.5 sm:gap-3">
                   <div className="mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                      <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                   </div>
                   <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-white mb-1.5 sm:mb-2 leading-tight group-hover/card:text-red-400 transition-colors">Supply Chain Deficit Vector</h4>
                      <p className="text-[9px] sm:text-[10px] text-white/50 font-mono leading-relaxed">Structural material shortages mapped for Q3. Predictive purchasing required to mitigate 8% margin leak.</p>
                      <span className="text-[8px] sm:text-[9px] text-[#D4A64F] font-bold mt-2 sm:mt-3 uppercase tracking-widest block group-hover/card:underline">Authorize Hedge &rarr;</span>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Bottom Tactical Level */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 pb-4">
        
        {/* Risk & Opportunity Matrix (Scatter Chart) */}
        <motion.div variants={itemVariants} className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-[300px] sm:h-[360px]">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Risk Impact Topography</h3>
              <p className="text-[8px] sm:text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5 sm:mt-1">Probability Index vs Capital Impact</p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
               <AlertOctagon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
            </div>
          </div>
          <div className="flex-1 -ml-6 -mb-2 sm:-ml-4 relative mt-2 sm:mt-4">
            <div className="absolute inset-4 border-l border-b border-white/10" />
            <div className="absolute inset-4 flex items-center justify-center border-l border-t border-dashed border-white/5 w-1/2 h-1/2 top-0 right-0 bg-red-500/[0.02]" />
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="x" name="Probability" unit="%" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} />
                <YAxis type="number" dataKey="y" name="Impact" unit="" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} />
                <ZAxis type="number" dataKey="z" range={[50, 300]} name="Value" />
                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#051121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '10px'}} />
                <Scatter name="Risks" data={riskData} fill="#8884d8">
                  {riskData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
             <span className="absolute bottom-6 right-6 text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-red-500/50">Critical Risk Sector</span>
          </div>
        </motion.div>

        {/* Departmental Performance */}
        <motion.div variants={itemVariants} className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-auto sm:h-[360px]">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Enterprise OKR Attainment</h3>
              <p className="text-[8px] sm:text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5 sm:mt-1">Cross-Functional Quarterly Execution</p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
               <Crosshair className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4 sm:gap-5 mt-2">
             {departmentData.map((dept: any, i: number) => (
               <div key={i} className="group cursor-pointer">
                 <div className="flex justify-between items-center mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
                   <span className="font-bold text-white active:text-asas-gold sm:group-hover:text-asas-gold transition-colors">{dept.name}</span>
                   <span className="font-mono text-white/70">{dept.actual}% <span className="text-white/30">/ {dept.target}% Target</span></span>
                 </div>
                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        dept.actual >= 90 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
                        dept.actual >= 80 ? 'bg-asas-gold shadow-[0_0_10px_rgba(212,166,79,0.5)]' : 
                        'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      }`}
                      style={{ width: `${dept.actual}%` }}
                    ></div>
                 </div>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
