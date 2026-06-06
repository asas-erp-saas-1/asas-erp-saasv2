'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Briefcase, Building2, LayoutDashboard, AlertCircle, ArrowUpRight, Copy, Check, Clock, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export function AgentDashboard({ metrics, events }: { metrics: any, events: any[] }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-in font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-8 bg-[#051121] rounded-3xl relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,166,79,0.15),_transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">Bonjour, Explorateur</h2>
          <p className="text-sm font-medium text-white/50">Voici ton pipeline actuel et tes objectifs du mois.</p>
        </div>
        <div className="relative z-10 flex gap-6 sm:gap-10">
          <div className="flex flex-col">
             <div className="text-3xl font-display font-bold text-asas-gold">{metrics.myDealsCount || 0}</div>
             <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Dossiers Actifs</div>
          </div>
          <div className="w-px bg-white/10 hidden sm:block"></div>
          <div className="flex flex-col">
             <div className="text-3xl font-display font-medium text-white">{formatCurrency(metrics.myPipelineValue || 0)}</div>
             <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Valeur Pipeline</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="p-6 bg-[#0A1829]/60 backdrop-blur-md border border-white/5 rounded-3xl shadow-sm group hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-shadow">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-white/70">Leads à contacter</h3>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                 <Users className="w-5 h-5 text-blue-400" />
              </div>
           </div>
           <div className="text-4xl font-display font-bold text-white">{metrics.myNewLeads || 0}</div>
           <p className="text-xs font-medium text-white/40 mt-2">Nouveaux prospects assignés</p>
           <Link href="/dashboard/leads" className="mt-8 flex items-center justify-between text-sm font-semibold text-blue-400 hover:text-asas-gold transition-colors">
              Gérer les leads <ArrowUpRight className="w-4 h-4" />
           </Link>
        </div>

        <div className="p-6 bg-[#0A1829]/60 backdrop-blur-md border border-white/5 rounded-3xl shadow-sm group hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-shadow">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-white/70">Visites & RDV</h3>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                 <Clock className="w-5 h-5 text-orange-400" />
              </div>
           </div>
           <div className="text-4xl font-display font-bold text-white">{metrics.todayTasks || 0}</div>
           <p className="text-xs font-medium text-white/40 mt-2">Tâches prévues aujourd'hui</p>
           <Link href="/dashboard/tasks" className="mt-8 flex items-center justify-between text-sm font-semibold text-orange-400 hover:text-asas-gold transition-colors">
              Voir mon agenda <ArrowUpRight className="w-4 h-4" />
           </Link>
        </div>

        <div className="p-6 bg-gradient-to-br from-[#121A22] to-[#0A1118] border border-asas-gold/20 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-asas-gold/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           <div className="relative z-10">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-asas-gold">Performance (Mois)</h3>
                <TrendingUp className="w-5 h-5 text-asas-gold" />
             </div>
             <div className="text-4xl font-display font-medium text-white">{metrics.wonDealsThisMonth || 0}</div>
             <p className="text-xs font-medium text-white/40 mt-2">Promesses signées (VSP)</p>
           </div>
        </div>
      </div>
    </div>
  );
}

export function OwnerDashboard({ metrics, events }: { metrics: any, events: any[] }) {
  const chartData = [
    { name: 'Jan', obj: 4000, reals: 2400 },
    { name: 'Fév', obj: 3000, reals: 1398 },
    { name: 'Mar', obj: 2000, reals: 9800 },
    { name: 'Avr', obj: 2780, reals: 3908 },
    { name: 'Mai', obj: 1890, reals: 4800 },
    { name: 'Juin', obj: 2390, reals: 3800 },
    { name: 'Juil', obj: 3490, reals: 4300 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-12 animate-in font-sans">
      
      {/* 1. FINANCIAL INDICATORS (ORACLE LOGIC) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
           <div className="w-10 h-10 rounded-xl bg-asas-gold/10 flex items-center justify-center border border-asas-gold/20">
              <TrendingUp className="w-5 h-5 text-asas-gold" />
           </div>
           <div>
             <h2 className="text-2xl font-display font-bold text-white tracking-tight">Finance & Comptabilité</h2>
             <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4A64F] mt-1">Oracle ERP Logic • Trésorerie & Opérations</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Big Pipeline Card */}
          <div className="col-span-1 flex flex-col">
             <div className="p-8 rounded-3xl bg-[#051121] shadow-xl text-white flex flex-col justify-between h-full relative overflow-hidden group border border-white/5 hover:border-asas-gold/30 transition-colors cursor-default">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,166,79,0.15),_transparent_70%)] pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-between mb-8">
                   <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Valeur Totale Pipeline</span>
                   <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-asas-gold/10 transition-colors">
                     <Briefcase className="w-6 h-6 text-white/40 group-hover:text-asas-gold transition-colors" />
                   </div>
                </div>
                <div className="relative z-10 mt-auto">
                   <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight truncate">{formatCurrency(metrics.pipelineValue)}</div>
                   <div className="flex items-center gap-2 mt-4 text-[10px] uppercase font-bold tracking-widest text-[#25D366]">
                     <TrendingUp className="w-4 h-4" />
                     <span>Potentiel CA prévisionnel</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Chart */}
          <div className="col-span-1 lg:col-span-2 p-8 border border-white/5 rounded-3xl bg-[#0A1829]/60 backdrop-blur-md shadow-sm flex flex-col transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-default">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Chiffre d'Affaires Global</h3>
                <p className="text-[10px] uppercase font-bold text-white/40 mt-1 tracking-widest">Comparatif Objectifs vs Réalisations</p>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff', opacity: 0.5, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{ fontSize: 10, fill: '#ffffff', opacity: 0.5, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#051121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }} />
                  <Bar dataKey="obj" name="Objectif" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reals" name="Réalisé" fill="#C7A15A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CRM & PORTFOLIO (HUBSPOT / ZILLOW LOGIC) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
           <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
           </div>
           <div>
             <h2 className="text-2xl font-display font-bold text-white tracking-tight">Acquisition & Catalogue Immobilier</h2>
             <p className="text-[10px] uppercase font-bold tracking-widest text-[#3b82f6] mt-1">HubSpot & Zillow Logic • Leads & Inventaire</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Unités Disponibles', value: metrics.availableUnitsCount, icon: Building2, sub: 'Portfolio Zillow (Actif)', link: '/dashboard/properties', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Nouveaux Leads', value: metrics.newLeadsCount, icon: Users, sub: "Pipeline HubSpot", link: '/dashboard/leads', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Demandes VSP', value: metrics.pendingContractsCount, icon: AlertCircle, sub: 'Contrats en attente', link: '/dashboard/deals', color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((kpi, idx) => (
            <Link href={kpi.link} key={idx} className="p-6 border border-white/5 rounded-3xl bg-[#0A1829]/60 backdrop-blur-md shadow-sm relative overflow-hidden group hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{kpi.label}</span>
                 <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", kpi.bg)}>
                   <kpi.icon className={clsx("w-5 h-5", kpi.color)} />
                 </div>
              </div>
              <div className="mt-4 flex flex-col">
                <div className="text-3xl font-display font-bold text-white truncate group-hover:text-asas-gold transition-colors">{kpi.value || 0}</div>
                <div className="flex items-center gap-2 mt-2">
                   <div className="text-[9px] uppercase font-bold tracking-widest text-white/30">{kpi.sub}</div>
                   <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-asas-gold transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. PROJECTS & OPERATIONS (ODOO LOGIC) */}
      {/* 4. SYSTEM LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
               <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <LayoutDashboard className="w-5 h-5 text-purple-400" />
               </div>
               <div>
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight">Opérations & Chantiers</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#a855f7] mt-1">Odoo Logic • Gestion de Projet</p>
               </div>
            </div>
            <div className="p-8 border border-white/5 rounded-3xl bg-[#0A1829]/60 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center h-[320px] group hover:border-white/20 transition-colors">
               <Building2 className="w-10 h-10 text-white/20 mb-4 group-hover:text-purple-400 transition-colors" />
               <p className="text-sm font-bold text-white uppercase tracking-widest">Pilotage des Chantiers</p>
               <p className="text-[10px] font-medium text-white/40 mt-2 max-w-[250px]">État d'avancement, bordereaux de prix, et livraisons SAV.</p>
               <Link href="/dashboard/projects" className="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-widest font-bold text-white rounded-xl transition-colors border border-white/10">Ouvrir Odoo Module</Link>
            </div>
         </div>

         <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Clock className="w-5 h-5 text-white/60" />
               </div>
               <div>
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight">Audit & Télémétrie</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mt-1">Event Sourcing • Logs</p>
               </div>
            </div>

            <div className="p-8 border border-white/5 rounded-3xl bg-[#0A1829]/60 backdrop-blur-md shadow-sm flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-white/70 tracking-tight uppercase">Historique Récent</h3>
                <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-lg bg-green-500/10 text-green-400 flex items-center gap-2 border border-green-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></div>
                   En direct
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                {events && events.length > 0 ? (
                  <div className="relative border-l border-white/10 ml-2 space-y-6 pb-4">
                    {events.map((event) => (
                      <div key={event.id} className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#051121] border-2 border-asas-gold" />
                        <div>
                          <p className="font-bold text-white text-[10px] uppercase tracking-widest leading-loose">{event.event_type.replace(/_/g, ' ')}</p>
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1"><span className="text-white">{event.aggregate_type}</span> ({event.aggregate_id.substring(0,6)})</p>
                          <p className="text-[8px] font-mono text-white/30 mt-2 tracking-widest">
                            {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center h-full flex flex-col items-center justify-center opacity-40">
                    <Clock className="w-8 h-8 mb-4 text-white/60" />
                    <p className="text-[9px] uppercase tracking-widest font-bold text-white">Aucune activité</p>
                  </div>
                )}
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export function RoleDashboards({ role, metrics, events }: { role: string, metrics: any, events: any[] }) {
  if (role === 'owner' || role === 'manager' || role === 'admin') {
    return <OwnerDashboard metrics={metrics} events={events} />;
  }
  return <AgentDashboard metrics={metrics} events={events} />;
}

