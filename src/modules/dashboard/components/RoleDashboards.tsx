'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Briefcase, Building2, LayoutDashboard, AlertCircle, ArrowUpRight, Copy, Check, Clock, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export function AgentDashboard({ metrics, events }: { metrics: any, events: any[] }) {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 md:p-8 bg-asas-charcoal border border-asas-gold/20 rounded-sm relative overflow-hidden group">
        <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay z-0" style={{ backgroundImage: 'radial-gradient(circle at center, #C7A15A 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative z-10">
          <h2 className="text-xl font-display font-bold text-asas-sand mb-1 tracking-wider uppercase">Bonjour, Explorateur</h2>
          <p className="text-xs text-asas-sand/60 font-mono tracking-wide">Voici ton pipeline actuel et tes objectifs du mois.</p>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="text-center">
             <div className="text-3xl font-display font-bold text-asas-gold">{metrics.myDealsCount || 0}</div>
             <div className="text-[10px] uppercase tracking-widest text-asas-sand/50">Dossiers Actifs</div>
          </div>
          <div className="w-px bg-asas-silver/20 hidden sm:block"></div>
          <div className="text-center">
             <div className="text-3xl font-display font-bold text-asas-sand">{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(metrics.myPipelineValue || 0)}</div>
             <div className="text-[10px] uppercase tracking-widest text-asas-sand/50">Valeur Pipeline</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm shadow-sm group">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-asas-charcoal/70 dark:text-asas-sand/70">Leads à contacter</h3>
              <Users className="w-5 h-5 text-asas-gold" />
           </div>
           <div className="text-4xl font-display font-bold text-asas-charcoal dark:text-asas-sand">{metrics.myNewLeads || 0}</div>
           <p className="text-[10px] text-asas-charcoal/50 dark:text-asas-sand/50 mt-2 font-mono uppercase">Nouveaux prospects assignés</p>
           <Link href="/dashboard/leads" className="mt-4 inline-flex items-center text-[10px] font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-wider hover:text-asas-gold transition-colors">
              Gérer les leads &rarr;
           </Link>
        </div>

        <div className="p-6 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm shadow-sm group">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-asas-charcoal/70 dark:text-asas-sand/70">Visites & RDV</h3>
              <Clock className="w-5 h-5 text-asas-copper" />
           </div>
           <div className="text-4xl font-display font-bold text-asas-charcoal dark:text-asas-sand">{metrics.todayTasks || 0}</div>
           <p className="text-[10px] text-asas-charcoal/50 dark:text-asas-sand/50 mt-2 font-mono uppercase">Tâches prévues aujourd'hui</p>
           <Link href="/dashboard/tasks" className="mt-4 inline-flex items-center text-[10px] font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-wider hover:text-asas-copper transition-colors">
              Voir mon agenda &rarr;
           </Link>
        </div>

        <div className="p-6 border border-asas-gold/20 dark:border-asas-gold/20 rounded-sm bg-asas-gold/5 dark:bg-asas-gold/10 backdrop-blur-sm shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-asas-gold">Performance (Mois)</h3>
              <TrendingUp className="w-5 h-5 text-asas-gold" />
           </div>
           <div className="text-4xl font-display font-bold text-asas-charcoal dark:text-asas-sand">{metrics.wonDealsThisMonth || 0}</div>
           <p className="text-[10px] text-asas-charcoal/50 dark:text-asas-sand/50 mt-2 font-mono uppercase">Promesses signées (VSP)</p>
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
    <div className="space-y-6 animate-in">
      {/* KPI WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unités Disponibles', value: metrics.availableUnitsCount, icon: Building2, sub: 'Inventaire Actif' },
          { label: 'Valeur Totale Pipeline', value: formatCurrency(metrics.pipelineValue), icon: Briefcase, sub: 'Potentiel CA' },
          { label: 'Nouveaux Leads', value: metrics.newLeadsCount, icon: Users, sub: "File d'attente" },
          { label: 'Demandes VSP/Contrats', value: metrics.pendingContractsCount, icon: AlertCircle, sub: 'Signature requise' },
        ].map((kpi, idx) => (
          <div key={idx} className="p-5 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm relative overflow-hidden group hover:border-asas-gold/40 transition-colors cursor-default">
            <div className="absolute top-4 right-4 text-asas-charcoal/5 dark:text-white/5 group-hover:text-asas-gold/10 transition-colors">
              <kpi.icon size={56} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-asas-charcoal/60 dark:text-asas-sand/60">{kpi.label}</span>
              <div className="mt-6 flex flex-col">
                <div className="text-2xl font-display font-bold text-asas-charcoal dark:text-asas-sand truncate">{kpi.value || 0}</div>
                <div className="text-[10px] font-mono tracking-wide text-asas-charcoal/40 dark:text-asas-sand/40 mt-1 uppercase">{kpi.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 p-6 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-asas-charcoal dark:text-asas-sand">Chiffre d'Affaires Global</h3>
              <p className="text-[10px] font-mono text-asas-silver uppercase mt-1">Objectifs vs Réalisations</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0F1113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Bar dataKey="obj" name="Objectif" fill="#A7A9AC" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
                <Bar dataKey="reals" name="Réalisé" fill="#C7A15A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border border-asas-charcoal/10 dark:border-white/5 rounded-sm bg-white/40 dark:bg-[#0F1113]/40 backdrop-blur-sm flex flex-col max-h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-asas-charcoal dark:text-asas-sand mb-6">Logs Télémesure (Temps Réel)</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {events && events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full shrink-0 bg-asas-gold" />
                  <div>
                    <p className="font-bold text-asas-charcoal dark:text-asas-sand text-xs">{event.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-asas-charcoal/60 dark:text-asas-sand/60 font-mono mt-0.5">{event.aggregate_type} - {event.aggregate_id.substring(0,8)}</p>
                    <p className="text-[9px] font-mono text-asas-copper mt-1">
                      {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center opacity-50 pt-8">
                <Clock className="w-8 h-8 mx-auto mb-3 text-asas-silver" />
                <p className="text-[10px] uppercase font-mono tracking-widest">Aucun évènement récent</p>
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
