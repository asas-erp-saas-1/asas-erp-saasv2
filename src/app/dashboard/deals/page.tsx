// src/app/dashboard/deals/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Handshake, AlertTriangle, Clock, ChevronRight, Plus, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { DealIntelligencePanel } from '@/modules/deals/components/DealIntelligencePanel'
import type { Deal } from '@/types/app'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  draft:       'bg-gray-800 text-gray-300 border-gray-700',
  active:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  negotiation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  closed:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled:   'bg-red-500/10 text-red-400 border-red-500/20',
}

const RISK_STYLE: Record<string, string> = {
  low:      'bg-gray-600',
  medium:   'bg-yellow-500',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M DZD'
  return new Intl.NumberFormat('fr-DZ').format(n) + ' DZD'
}

// ─── Deal row ─────────────────────────────────────────────────────────────────
function DealRow({ deal, isSelected, onSelect }: { deal: Deal; isSelected: boolean; onSelect: () => void }) {
  const agreedPrice = (deal as any).agreed_price || (deal as any).amount || 0;
  const paymentsReceived = (deal as any).total_payments_received || 0;
  const pct = agreedPrice > 0
    ? Math.round((paymentsReceived / agreedPrice) * 100)
    : 0

  const isOverdue = deal.next_action_due && new Date(deal.next_action_due) < new Date()
    && !['closed', 'cancelled'].includes(deal.status || '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={clsx(
        'group flex items-center gap-4 px-5 py-4 border-b cursor-pointer transition-all',
        isSelected 
          ? 'bg-blue-500/5 border-white/10' 
          : 'bg-[#0A0A0A] border-white/5 hover:bg-white/5 hover:border-white/10'
      )}
      onClick={onSelect}
    >
      {/* Risk indicator */}
      <div className={clsx('h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/10', RISK_STYLE[deal.risk_level || 'low'])} />

      {/* Client + property */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={clsx("font-bold truncate transition-colors text-sm", isSelected ? 'text-white' : 'text-gray-200')}>
            {(deal as any).clients?.full_name ?? 'Client Inconnu'}
          </p>
          {(deal as any).properties?.projects?.name && (
            <span className="text-[10px] uppercase tracking-widest text-gray-400 truncate hidden sm:block bg-[#050505] border border-white/10 px-2 py-0.5 rounded-md">
              {(deal as any).properties.projects.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm font-bold text-gray-300">{fmt(agreedPrice)}</span>
          {deal.next_action && (
            <span className={clsx('text-[10px] uppercase tracking-wider flex items-center gap-1.5 px-2 py-0.5 rounded-md border', isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-800 text-gray-400 border-gray-700')}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <Clock className="h-3 w-3" />
              {deal.next_action}
            </span>
          )}
        </div>
      </div>

      {/* Payment progress bar */}
      <div className="hidden md:flex flex-col items-end w-28">
        <div className="w-full flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1.5">
          <span className={pct === 100 ? 'text-emerald-400' : 'text-gray-500'}>Payé</span>
          <span className="text-gray-300">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={clsx('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-600')}
          />
        </div>
      </div>

      {/* Status badge */}
      <span className={clsx('px-3 py-1 rounded-md border text-[10px] font-bold shrink-0 uppercase tracking-widest', STATUS_STYLE[deal.status || 'draft'])}>
        {(deal.status || 'draft').replace('_', ' ')}
      </span>

      <ChevronRight className={clsx('h-5 w-5 shrink-0 transition-transform', isSelected ? 'text-white translate-x-1' : 'text-gray-600 group-hover:text-gray-400')} />
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const router = useRouter()
  const [deals,      setDeals]       = useState<Deal[]>([])
  const [total,      setTotal]       = useState(0)
  const [loading,    setLoading]     = useState(true)
  const [selectedId, setSelectedId]  = useState<string | null>(null)
  const [search,     setSearch]      = useState('')
  const [statusFilter, setStatus]    = useState<string>('active,negotiation')
  const [page,       setPage]        = useState(1)
  const LIMIT = 25

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (statusFilter) statusFilter.split(',').forEach(s => params.append('status', s.trim()))

      const res = await fetch(`/api/deals?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      let results: Deal[] = data.data ?? []

      // Client-side search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        results = results.filter(d =>
          (d as any).clients?.full_name?.toLowerCase().includes(q) ||
          (d as any).properties?.projects?.name?.toLowerCase().includes(q) ||
          d.next_action?.toLowerCase().includes(q)
        )
      }

      setDeals(results)
      setTotal(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#0A0A0A] rounded-2xl shadow-2xl border border-white/5 text-gray-100">
      {/* Left: list */}
      <div className={clsx('flex flex-col bg-[#0A0A0A] overflow-hidden transition-all duration-300 ease-in-out', selectedId ? 'hidden lg:flex lg:w-[45%] border-r border-white/5' : 'w-full')}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 bg-[#0A0A0A] z-10 shrink-0">
          <div className="flex w-full items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-tight font-display">
                Transactions
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1.5 hidden sm:block">{total} actives sur le réseau</p>
            </div>
            <button onClick={() => router.push('/dashboard/deals/new')} className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.02] active:scale-95 shrink-0">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Initier Deal
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher entité, projet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#050505] text-sm font-medium border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'En cours', value: 'active,negotiation' },
              { label: 'Tous',    value: '' },
              { label: 'Brouillon',  value: 'draft' },
              { label: 'Conclu', value: 'closed' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => { setStatus(f.value); setPage(1) }}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all border',
                  statusFilter === f.value
                    ? 'bg-blue-500/10 text-white border-blue-500/20'
                    : 'bg-transparent text-gray-500 hover:text-gray-300 border-white/5 hover:border-white/10'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deal list */}
        <div className="flex-1 overflow-y-auto bg-[#050505]">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-[#0A0A0A] animate-pulse rounded-xl border border-white/5" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                <Handshake className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-300 font-bold mb-1">Pipeline vide</p>
              <p className="text-xs uppercase tracking-widest text-gray-600">Ajustez vos filtres de recherche.</p>
            </div>
          ) : (
            <AnimatePresence>
              {deals.map(deal => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  isSelected={deal.id === selectedId}
                  onSelect={() => setSelectedId(deal.id === selectedId ? null : deal.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination - only show if needed */}
        {total > LIMIT && (
          <div className="px-6 py-4 border-t border-white/5 bg-[#0A0A0A] flex items-center justify-between shrink-0">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 bg-[#050505] border border-white/5 disabled:opacity-40 hover:text-white"
            >Précédent</button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Page {page} / {Math.ceil(total / LIMIT)}</span>
            <button
              disabled={page >= Math.ceil(total / LIMIT)}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 bg-[#050505] border border-white/5 disabled:opacity-40 hover:text-white"
            >Suivant</button>
          </div>
        )}
      </div>

      {/* Right: deal detail panel */}
      {selectedId ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]"
        >
          <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/5 py-2 px-4 flex items-center lg:hidden z-10">
            <button onClick={() => setSelectedId(null)} className="p-2 text-xs font-bold text-blue-400 flex items-center gap-1 uppercase tracking-widest hover:text-blue-300 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180 -ml-1" /> Retour
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DealIntelligencePanel dealId={selectedId} />
          </div>
        </motion.div>
      ) : (
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#050505] border-l border-white/5 text-center p-12">
          <div className="w-24 h-24 bg-[#0A0A0A] border border-white/10 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all"></div>
            <Handshake className="w-10 h-10 text-gray-400 relative z-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight font-display">Poste de Contrôle</h2>
          <p className="text-sm font-medium text-gray-500 max-w-sm">
            Sélectionnez une entité dans la liste pour accéder aux indicateurs financiers, calculs de risques et actions prédictives.
          </p>
        </div>
      )}
    </div>
  )
}
