// src/app/dashboard/finance/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { motion, Variants } from 'motion/react'
import { clsx } from 'clsx'

interface CashPosition {
  cashBalance:       number
  receivablesTotal:  number
  payablesTotal:     number
  netPosition:       number
  liquidityRatio:    number
  liquidityMode:     string
  survivalDaysLeft:  number | null
}

interface AgingBucket { label: string; amount: { amount: number }; count: number; pct: number }
interface AgingData { totalOutstanding: { amount: number }; buckets: AgingBucket[]; collectionEfficiency: number; overdueCount: number }

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return (n/1_000_000_000).toFixed(1)+'G DZD'
  if (Math.abs(n) >= 1_000_000)     return (n/1_000_000).toFixed(1)+'M DZD'
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n))+' DZD'
}

import { ExpensesSection } from './ExpensesSection'
import { LedgerSection } from './LedgerSection'

export default function FinancePage() {
  const [cash,    setCash]    = useState<CashPosition | null>(null)
  const [aging,   setAging]   = useState<AgingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cashRes, agingRes] = await Promise.all([
          fetch('/api/ledger?view=cash_position'),
          fetch('/api/ledger?view=aging'),
        ])
        if (cashRes.ok) setCash(await cashRes.json())
        if (agingRes.ok) setAging(await agingRes.json())
      } catch (err: any) {
        import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(err, { context: 'FinancePage load' }))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div className="h-24 w-1/3 bg-white dark:bg-[#141618] border border-asas-silver/20 rounded-sm animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl animate-pulse" />
    </div>
  )

  const modeStyle = (cash?.liquidityMode ? {
    growth:   { banner: null },
    caution:  { banner: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 border' },
    survival: { banner: 'bg-red-500/10 border-red-500/20 text-red-500 border' },
  }[cash.liquidityMode as 'growth' | 'caution' | 'survival'] : null) ?? { banner: null }

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
    <div className="flex-1 text-gray-900 dark:text-gray-100 flex flex-col">
      <div className="w-full space-y-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full mb-10 pt-4">
          <h1 className="text-4xl font-bold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-4 font-display uppercase">
             <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-asas-gold/20 to-asas-gold/10 border border-asas-gold/30 flex items-center justify-center shadow-lg">
                 <DollarSign className="h-7 w-7 text-asas-gold" /> 
             </div>
             Analytique Financière
          </h1>
          <p className="text-xs uppercase tracking-wider font-semibold text-asas-silver/70 mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-asas-gold animate-pulse" />
            Prévisions & Trésorerie Système
          </p>
        </motion.div>

        {/* Liquidity warning */}
        {cash && cash.liquidityMode !== 'growth' && modeStyle?.banner && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={clsx('rounded-2xl px-6 py-4 flex items-start gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]', modeStyle.banner)}>
            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", cash.liquidityMode === 'survival' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400')}>
               <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs uppercase tracking-widest block mb-2">
                {cash.liquidityMode === 'survival' ? '🚨 PROTOCOLE SURVIE ACTIF' : '⚠️ ATTENTION REQUISE'}
              </span>
               <p className="text-sm font-bold opacity-80">
                  {cash.liquidityMode === 'survival'
                  ? `${cash.survivalDaysLeft ?? '?'} jours de trésorerie restants au rythme actuel de dépense.`
                  : 'La trésorerie est en dessous du niveau de confort. Surveillez les encaissements de près.'}
               </p>
            </div>
          </motion.div>
        )}

        {/* Cash position cards */}
        {cash && (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Solde Liquidité', value: cash.cashBalance, icon: DollarSign, color: cash.cashBalance > 5_000_000 ? 'text-asas-emerald' : 'text-red-500', gradient: 'from-asas-emerald/10 to-asas-emerald/5', iconBg: 'bg-asas-emerald/10', iconColor: 'text-asas-emerald' },
              { label: 'Créances Clients', value: cash.receivablesTotal, icon: Clock, color: 'text-blue-500', gradient: 'from-blue-500/10 to-blue-500/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
              { label: 'Dettes & Commissions', value: cash.payablesTotal, icon: TrendingDown, color: 'text-asas-copper', gradient: 'from-asas-copper/10 to-asas-copper/5', iconBg: 'bg-asas-copper/10', iconColor: 'text-asas-copper' },
              { label: 'Position Nette', value: cash.netPosition, icon: CheckCircle, color: cash.netPosition >= 0 ? 'text-asas-emerald' : 'text-red-500', gradient: cash.netPosition >= 0 ? 'from-asas-emerald/10 to-asas-emerald/5' : 'from-red-500/10 to-red-500/5', iconBg: cash.netPosition >= 0 ? 'bg-asas-emerald/10' : 'bg-red-500/10', iconColor: cash.netPosition >= 0 ? 'text-asas-emerald' : 'text-red-500' },
            ].map(({ label, value, icon: Icon, color, gradient, iconBg, iconColor }, i) => (
              <motion.div key={label} variants={item} className={clsx("rounded-lg border border-white/10 p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden group bg-gradient-to-br", gradient)}>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Icon className="w-16 h-16 text-asas-silver" />
                </div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center border border-white/10", iconBg, iconColor)}>
                      <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-asas-charcoal dark:text-asas-sand/80 leading-tight">{label}</p>
                </div>
                <p className={clsx('text-2xl font-bold tracking-tighter relative z-10 font-mono', color)}>{fmt(value)}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Receivables aging */}
        {aging && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#141618] rounded-lg border border-white/10 p-8 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-6">
              <div>
                  <h2 className="text-2xl font-bold text-asas-charcoal dark:text-asas-sand tracking-tight font-display uppercase">Analyse d'Ancienneté</h2>
                  <p className="text-xs uppercase font-semibold tracking-wider text-asas-silver/70 mt-2">Détail de l'échéancier des flux entrants</p>
              </div>
              <div className="flex items-center gap-6 bg-gradient-to-r from-white/50 to-white/30 dark:from-white/5 dark:to-white/[0.02] rounded-lg p-5 shrink-0 border border-white/10">
                 <div>
                     <p className="text-[9px] uppercase tracking-wider font-semibold text-asas-silver/70 mb-2">Défauts Critiques</p>
                     <p className="text-2xl font-bold text-red-500 leading-none">{aging.overdueCount}</p>
                 </div>
                 <div className="w-px h-12 bg-white/10" />
                 <div>
                     <p className="text-[9px] uppercase tracking-wider font-semibold text-asas-silver/70 mb-2">Efficience Encaissement</p>
                     <p className="text-2xl font-bold text-asas-emerald leading-none">{Math.round(aging.collectionEfficiency * 100)}%</p>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {aging.buckets.map(bucket => (
                <motion.div key={bucket.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-lg p-6 border relative overflow-hidden shadow-md hover:shadow-lg transition-all', bucket.label === '90+' ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5' : bucket.label === '61-90' ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5' : 'border-white/10 bg-gradient-to-br from-white/50 to-white/30 dark:from-white/5 dark:to-white/[0.02]')}>
                  {bucket.label === '90+' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/15 rounded-full blur-2xl" />}
                  <p className="text-xs uppercase tracking-wider font-semibold text-asas-silver/70 mb-3 relative z-10">{bucket.label} jours</p>
                  <p className={clsx('text-xl font-bold tracking-tight relative z-10 font-mono', bucket.label === '90+' ? 'text-red-500' : bucket.label === '61-90' ? 'text-orange-500' : 'text-asas-charcoal dark:text-asas-sand')}>
                    {fmt(bucket.amount.amount)}
                  </p>
                  <div className="flex items-center justify-between mt-3 font-semibold relative z-10">
                    <span className="text-xs text-asas-silver/70">{bucket.count} flux</span>
                    <span className="text-xs text-asas-silver/70 bg-white/10 px-2.5 py-1 rounded-lg">{bucket.pct}%</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-3 bg-asas-sand/50 dark:bg-black/20 border border-asas-silver/10 rounded-sm overflow-hidden flex shadow-inner">
                  {aging.buckets.map(bucket => (
                  <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${bucket.pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      key={bucket.label}
                      className={clsx('h-full transition-all duration-500', bucket.label === '0-30' ? 'bg-asas-emerald' : bucket.label === '31-60' ? 'bg-asas-gold' : bucket.label === '61-90' ? 'bg-orange-500' : 'bg-red-500')}
                  />
                  ))}
              </div>
              <div className="flex gap-6 mt-5 justify-center md:justify-start">
                  {[{ label:'0-30', c:'bg-asas-emerald'}, {label:'31-60',c:'bg-asas-gold'},{label:'61-90',c:'bg-orange-500'},{label:'90+',c:'bg-red-500'}].map(l => (
                  <span key={l.label} className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-asas-silver">
                      <span className={clsx('h-2.5 w-2.5 rounded-full', l.c)} />{l.label} jours
                  </span>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        <LedgerSection />
        <ExpensesSection />
      </div>
    </div>
  )
}
