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
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-24 w-1/3 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )

  const modeStyle = (cash?.liquidityMode ? {
    growth:   { banner: null },
    caution:  { banner: 'bg-yellow-50 border-yellow-200 text-yellow-800 border' },
    survival: { banner: 'bg-red-50 border-red-200 text-red-800 border' },
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
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Vue d'ensemble Financière</h1>
        <p className="text-gray-500 mt-2">Situation de trésorerie, ancienneté des créances et aperçu du grand livre</p>
      </div>

      {/* Liquidity warning */}
      {cash && cash.liquidityMode !== 'growth' && modeStyle?.banner && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={clsx('rounded-2xl px-6 py-4 flex items-start gap-4 shadow-sm', modeStyle.banner)}>
          <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", cash.liquidityMode === 'survival' ? 'bg-red-100 border-red-200 text-red-600' : 'bg-yellow-100 border-yellow-200 text-yellow-600')}>
             <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base block mb-1">
              {cash.liquidityMode === 'survival' ? '🚨 MODE SURVIE ACTIF' : '⚠️ ATTENTION REQUISE'}
            </span>
             <p className="text-sm">
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
            { label: 'Solde de Trésorerie', value: cash.cashBalance,      icon: DollarSign, color: cash.cashBalance > 5_000_000 ? 'text-emerald-700' : 'text-red-700', bg: cash.cashBalance > 5_000_000 ? 'bg-emerald-50' : 'bg-red-50', iconColor: cash.cashBalance > 5_000_000 ? 'text-emerald-500' : 'text-red-500' },
            { label: 'Créances Clients',    value: cash.receivablesTotal, icon: Clock,      color: 'text-blue-900', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
            { label: 'Commissions Dues',    value: cash.payablesTotal,    icon: TrendingDown, color: 'text-amber-900', bg: 'bg-amber-50', iconColor: 'text-amber-500' },
            { label: 'Position Nette',      value: cash.netPosition,      icon: CheckCircle, color: cash.netPosition >= 0 ? 'text-emerald-700' : 'text-red-700', bg: cash.netPosition >= 0 ? 'bg-emerald-50' : 'bg-red-50', iconColor: cash.netPosition >= 0 ? 'text-emerald-500' : 'text-red-500' },
          ].map(({ label, value, icon: Icon, color, bg, iconColor }, i) => (
            <motion.div key={label} variants={item} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", bg, iconColor)}>
                    <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-500 leading-tight">{label}</p>
              </div>
              <p className={clsx('text-3xl font-bold tracking-tight', color)}>{fmt(value)}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Receivables aging */}
      {aging && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Âge des Créances (Receivables Aging)</h2>
                <p className="text-sm text-gray-500 mt-1">Analyse de l'échéancier des paiements clients en attente.</p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 shrink-0">
               <div>
                   <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-0.5">En retard</p>
                   <p className="text-lg font-bold text-gray-900 leading-none">{aging.overdueCount}</p>
               </div>
               <div className="w-px h-8 bg-gray-200" />
               <div>
                   <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-0.5">Tx d'encaissement</p>
                   <p className="text-lg font-bold text-emerald-600 leading-none">{Math.round(aging.collectionEfficiency * 100)}%</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {aging.buckets.map(bucket => (
              <div key={bucket.label} className={clsx('rounded-2xl p-5 border relative overflow-hidden', bucket.label === '90+' ? 'border-red-100 bg-red-50/50' : bucket.label === '61-90' ? 'border-orange-100 bg-orange-50/50' : 'border-gray-100 bg-gray-50/50')}>
                {bucket.label === '90+' && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-2xl" />}
                <p className="text-sm font-bold text-gray-500 mb-2 relative z-10">{bucket.label} jours</p>
                <p className={clsx('text-2xl font-bold tracking-tight relative z-10', bucket.label === '90+' ? 'text-red-700' : bucket.label === '61-90' ? 'text-orange-700' : 'text-gray-900')}>
                  {fmt(bucket.amount.amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium relative z-10">{bucket.count} paiements · {bucket.pct}%</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                {aging.buckets.map(bucket => (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bucket.pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    key={bucket.label}
                    className={clsx('h-full transition-all duration-500', bucket.label === '0-30' ? 'bg-blue-400' : bucket.label === '31-60' ? 'bg-yellow-400' : bucket.label === '61-90' ? 'bg-orange-500' : 'bg-red-500')}
                />
                ))}
            </div>
            <div className="flex gap-6 mt-4 justify-center md:justify-start">
                {[{ label:'0-30', c:'bg-blue-400'}, {label:'31-60',c:'bg-yellow-400'},{label:'61-90',c:'bg-orange-500'},{label:'90+',c:'bg-red-500'}].map(l => (
                <span key={l.label} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <span className={clsx('h-3 w-3 rounded-full', l.c)} />{l.label} jours
                </span>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
