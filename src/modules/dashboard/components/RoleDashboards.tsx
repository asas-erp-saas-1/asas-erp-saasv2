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
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-8 bg-asas-navy rounded-2xl relative overflow-hidden group shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-asas-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-display font-medium text-white mb-2 tracking-tight">Bonjour, Explorateur</h2>
          <p className="text-sm font-medium text-white/70">Voici ton pipeline actuel et tes objectifs du mois.</p>
        </div>
        <div className="relative z-10 flex gap-6 sm:gap-10">
          <div className="flex flex-col">
             <div className="text-3xl font-display font-medium text-asas-gold">{metrics.myDealsCount || 0}</div>
             <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mt-1">Dossiers Actifs</div>
          </div>
          <div className="w-px bg-white/10 hidden sm:block"></div>
          <div className="flex flex-col">
             <div className="text-3xl font-display font-medium text-white">{formatCurrency(metrics.myPipelineValue || 0)}</div>
             <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mt-1">Valeur Pipeline</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-[#141618] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm group hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Leads à contacter</h3>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                 <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
           </div>
           <div className="text-4xl font-display font-semibold text-gray-900 dark:text-white">{metrics.myNewLeads || 0}</div>
           <p className="text-sm font-medium text-gray-500 mt-2">Nouveaux prospects assignés</p>
           <Link href="/dashboard/leads" className="mt-6 flex items-center justify-between text-sm font-semibold text-asas-navy dark:text-blue-400 hover:text-asas-gold transition-colors">
              Gérer les leads <ArrowUpRight className="w-4 h-4" />
           </Link>
        </div>

        <div className="p-6 bg-white dark:bg-[#141618] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm group hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Visites & RDV</h3>
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                 <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
           </div>
           <div className="text-4xl font-display font-semibold text-gray-900 dark:text-white">{metrics.todayTasks || 0}</div>
           <p className="text-sm font-medium text-gray-500 mt-2">Tâches prévues aujourd'hui</p>
           <Link href="/dashboard/tasks" className="mt-6 flex items-center justify-between text-sm font-semibold text-asas-navy dark:text-orange-400 hover:text-asas-gold transition-colors">
              Voir mon agenda <ArrowUpRight className="w-4 h-4" />
           </Link>
        </div>

        <div className="p-6 bg-asas-gold/10 border border-asas-gold/20 rounded-2xl shadow-sm flex flex-col justify-between">
           <div>
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-asas-gold">Performance (Mois)</h3>
                <TrendingUp className="w-5 h-5 text-asas-gold" />
             </div>
             <div className="text-4xl font-display font-semibold text-gray-900 dark:text-white">{metrics.wonDealsThisMonth || 0}</div>
             <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Promesses signées (VSP)</p>
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
    <div className="space-y-8 animate-in">
      {/* KPI WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unités Disponibles', value: metrics.availableUnitsCount, icon: Building2, sub: 'Inventaire Actif' },
          { label: 'Valeur Totale Pipeline', value: formatCurrency(metrics.pipelineValue), icon: Briefcase, sub: 'Potentiel CA' },
          { label: 'Nouveaux Leads', value: metrics.newLeadsCount, icon: Users, sub: "File d'attente" },
          { label: 'Demandes VSP/Contrats', value: metrics.pendingContractsCount, icon: AlertCircle, sub: 'Signature requise' },
        ].map((kpi, idx) => (
          <div key={idx} className="p-6 border border-gray-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#141618] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-default flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
               <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{kpi.label}</span>
               <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-asas-gold/10 transition-colors">
                 <kpi.icon className="w-5 h-5 text-gray-400 group-hover:text-asas-gold transition-colors" />
               </div>
            </div>
            <div className="mt-4 flex flex-col">
              <div className="text-3xl font-display font-semibold text-gray-900 dark:text-white truncate">{kpi.value || 0}</div>
              <div className="text-xs font-medium text-gray-500 mt-2">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 p-8 border border-gray-200 dark:border-white/5 rounded-3xl bg-white dark:bg-[#141618] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chiffre d'Affaires Global</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">Objectifs vs Réalisations</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10 dark:opacity-5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#141618', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="obj" name="Objectif" fill="#E5E7EB" dark={{ fill: '#374151' }} radius={[4, 4, 0, 0]} />
                <Bar dataKey="reals" name="Réalisé" fill="#C7A15A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 border border-gray-200 dark:border-white/5 rounded-3xl bg-white dark:bg-[#141618] shadow-sm flex flex-col max-h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit & Historique</h3>
            <div className="px-2.5 py-1 text-xs font-semibold rounded-md bg-asas-gold/10 text-asas-gold">En direct</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
            {events && events.length > 0 ? (
              <div className="relative border-l border-gray-200 dark:border-white/10 ml-2 space-y-6 pb-4">
                {events.map((event) => (
                  <div key={event.id} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white dark:bg-[#141618] border-2 border-asas-gold" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-medium text-gray-500 mt-1">Sur l'entité <span className="font-medium text-gray-700 dark:text-gray-300">{event.aggregate_type}</span> ({event.aggregate_id.substring(0,8)})</p>
                      <p className="text-xs font-medium text-gray-400 mt-2">
                        {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center h-full flex flex-col items-center justify-center opacity-60">
                <Clock className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-500">Aucune activité récente détectée</p>
              </div>
            )}
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
