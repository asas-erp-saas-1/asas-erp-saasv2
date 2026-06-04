'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Briefcase, Building2, LayoutDashboard, AlertCircle, ArrowUpRight, Copy, Check, Clock, TrendingUp, Target } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function AgentDashboard({ metrics, events }: { metrics: any, events: any[] }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Card with Key Metrics */}
      <div className="relative overflow-hidden bg-gradient-to-br from-asas-navy via-asas-navy to-asas-navy/80 rounded-2xl p-8 shadow-xl border border-asas-gold/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-asas-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-asas-emerald/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-display font-semibold text-white mb-2 tracking-tight">Bienvenue</h2>
              <p className="text-sm text-white/70">Voici ton pipeline actuel et tes objectifs du mois</p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                <div className="text-3xl font-display font-semibold text-asas-gold">{metrics.myDealsCount || 0}</div>
                <div className="text-xs font-medium text-white/60 uppercase tracking-wider mt-2">Dossiers Actifs</div>
              </motion.div>
              <div className="w-px bg-white/10"></div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                <div className="text-3xl font-display font-semibold text-white">{formatCurrency(metrics.myPipelineValue || 0)}</div>
                <div className="text-xs font-medium text-white/60 uppercase tracking-wider mt-2">Valeur Pipeline</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Leads à contacter</h3>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-semibold text-foreground">{metrics.myNewLeads || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Nouveaux prospects assignés</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/leads" className="text-sm font-semibold text-asas-gold hover:text-asas-gold/80 transition-colors inline-flex items-center gap-2 group">
                Gérer les leads <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Visites & RDV</h3>
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-semibold text-foreground">{metrics.todayTasks || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Tâches prévues aujourd'hui</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/tasks" className="text-sm font-semibold text-asas-gold hover:text-asas-gold/80 transition-colors inline-flex items-center gap-2 group">
                Voir mon agenda <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full bg-asas-gold/5 border-asas-gold/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-asas-gold">Performance (Mois)</h3>
                <div className="w-10 h-10 rounded-lg bg-asas-gold/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-asas-gold" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-semibold text-foreground">{metrics.wonDealsThisMonth || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Promesses signées (VSP)</p>
            </CardContent>
          </Card>
        </motion.div>
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
          { label: 'Unités Disponibles', value: metrics.availableUnitsCount, icon: Building2, sub: 'Inventaire Actif', color: 'from-blue-500/10 to-blue-500/5' },
          { label: 'Valeur Totale Pipeline', value: formatCurrency(metrics.pipelineValue), icon: Briefcase, sub: 'Potentiel CA', color: 'from-asas-gold/10 to-asas-gold/5' },
          { label: 'Nouveaux Leads', value: metrics.newLeadsCount, icon: Users, sub: "File d'attente", color: 'from-emerald-500/10 to-emerald-500/5' },
          { label: 'Demandes VSP/Contrats', value: metrics.pendingContractsCount, icon: AlertCircle, sub: 'Signature requise', color: 'from-orange-500/10 to-orange-500/5' },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className={`h-full bg-gradient-to-br ${kpi.color} hover:shadow-lg transition-all`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{kpi.label}</span>
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group hover:bg-asas-gold/10 transition-colors">
                    <kpi.icon className="w-5 h-5 text-muted-foreground group-hover:text-asas-gold transition-colors" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col">
                <div className="text-3xl font-display font-semibold text-foreground truncate">{kpi.value || 0}</div>
                <div className="text-xs text-muted-foreground mt-2">{kpi.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-1 lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div>
                <h3 className="text-lg font-semibold">Chiffre d'Affaires Global</h3>
                <p className="text-sm text-muted-foreground mt-1">Objectifs vs Réalisations</p>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full max-h-[500px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Audit & Historique</h3>
                <Badge variant="default">En direct</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar relative">
              {events && events.length > 0 ? (
                <div className="relative border-l border-white/10 ml-2 space-y-6 pb-4">
                  {events.map((event) => (
                    <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-background border-2 border-asas-gold" />
                      <div>
                        <p className="font-semibold text-foreground text-sm capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground mt-1">Sur l'entité <span className="font-medium text-foreground/80">{event.aggregate_type}</span> ({event.aggregate_id.substring(0,8)})</p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center h-full flex flex-col items-center justify-center opacity-60">
                  <Clock className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
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
