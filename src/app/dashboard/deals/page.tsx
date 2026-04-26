// src/app/dashboard/deals/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Handshake, AlertTriangle, Clock, ChevronRight, Plus, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { DealIntelligencePanel } from '@/modules/deals/components/DealIntelligencePanel'
import type { Deal } from '@/types/app'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  draft:       'bg-gray-100 text-gray-600 border-gray-200',
  active:      'bg-blue-50 text-blue-700 border-blue-200',
  negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
  closed:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:   'bg-red-50 text-red-700 border-red-200',
}

const RISK_STYLE: Record<string, string> = {
  low:      'bg-gray-200',
  medium:   'bg-yellow-400',
  high:     'bg-orange-500',
  critical: 'bg-red-600',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M DZD'
  return new Intl.NumberFormat('fr-DZ').format(n) + ' DZD'
}

// ─── Deal row ─────────────────────────────────────────────────────────────────
function DealRow({ deal, isSelected, onSelect }: { deal: Deal; isSelected: boolean; onSelect: () => void }) {
  const pct = deal.agreed_price > 0
    ? Math.round((deal.total_payments_received / deal.agreed_price) * 100)
    : 0

  const isOverdue = deal.next_action_due && new Date(deal.next_action_due) < new Date()
    && !['closed', 'cancelled'].includes(deal.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={clsx(
        'group flex items-center gap-4 px-5 py-4 border-b cursor-pointer transition-all',
        isSelected 
          ? 'bg-blue-50/50 border-blue-100 shadow-inner' 
          : 'bg-white border-gray-50 hover:bg-gray-50 hover:border-gray-100'
      )}
      onClick={onSelect}
    >
      {/* Risk indicator */}
      <div className={clsx('h-2.5 w-2.5 rounded-full shrink-0 shadow-sm border border-white', RISK_STYLE[deal.risk_level || 'low'])} />

      {/* Client + property */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={clsx("font-semibold truncate transition-colors", isSelected ? 'text-blue-900' : 'text-gray-900')}>
            {(deal as any).clients?.full_name ?? 'Unknown Client'}
          </p>
          {(deal as any).properties?.projects?.name && (
            <span className="text-xs text-gray-400 truncate hidden sm:block bg-gray-100 px-2 py-0.5 rounded-md">
              {(deal as any).properties.projects.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-sm font-medium text-gray-600">{fmt(deal.agreed_price)}</span>
          {deal.next_action && (
            <span className={clsx('text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-md', isOverdue ? 'bg-red-50 text-red-700 font-medium' : 'bg-gray-50 text-gray-500 font-medium')}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <Clock className="h-3 w-3" />
              {deal.next_action}
            </span>
          )}
        </div>
      </div>

      {/* Payment progress bar */}
      <div className="hidden md:flex flex-col items-end w-28">
        <div className="w-full flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1">
          <span className={pct === 100 ? 'text-emerald-600' : 'text-gray-400'}>Payé</span>
          <span className="text-gray-900">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={clsx('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-300')}
          />
        </div>
      </div>

      {/* Status badge */}
      <span className={clsx('px-3 py-1 rounded-md border text-xs font-semibold shrink-0 uppercase tracking-wide', STATUS_STYLE[deal.status])}>
        {deal.status.replace('_', ' ')}
      </span>

      <ChevronRight className={clsx('h-5 w-5 shrink-0 transition-transform', isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-300 group-hover:text-gray-500')} />
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DealsPage() {
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Left: list */}
      <div className={clsx('flex flex-col bg-white overflow-hidden transition-all duration-300 ease-in-out', selectedId ? 'hidden lg:flex lg:w-[45%] border-r border-gray-100' : 'w-full')}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white z-10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Transactions
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">{total} total actives</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2A4A] text-white rounded-xl text-sm font-semibold hover:bg-[#243554] hover:shadow-md transition-all active:scale-95">
              <Plus className="h-4 w-4" /> Nouvelle Deal
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client, projet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-sm border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2A4A]/20 focus:bg-white transition-all placeholder:text-gray-400"
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
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  statusFilter === f.value
                    ? 'bg-[#1A2A4A] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deal list */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Handshake className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">Aucune transaction</p>
              <p className="text-sm">Essayez de modifier vos filtres ou de créer une nouvelle transaction.</p>
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
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 disabled:opacity-40 hover:bg-gray-100"
            >Précédent</button>
            <span className="text-sm font-medium text-gray-500">Page {page} / {Math.ceil(total / LIMIT)}</span>
            <button
              disabled={page >= Math.ceil(total / LIMIT)}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 disabled:opacity-40 hover:bg-gray-100"
            >Suivant</button>
          </div>
        )}
      </div>

      {/* Right: deal detail panel */}
      {selectedId ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:hidden z-10">
            <button onClick={() => setSelectedId(null)} className="text-sm font-medium text-blue-600 flex items-center gap-1">
              <ChevronRight className="w-4 h-4 rotate-180" /> Retour
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DealIntelligencePanel dealId={selectedId} />
          </div>
        </motion.div>
      ) : (
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-50 border-l border-gray-200 text-center p-12">
          <div className="w-24 h-24 bg-white shadow-sm rounded-3xl flex items-center justify-center mb-6 border border-gray-100">
            <Handshake className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Centre de Transaction</h2>
          <p className="text-gray-500 max-w-sm">Sélectionnez une transaction dans la liste pour voir les détails financiers, le statut de risque et les prochaines actions.</p>
        </div>
      )}
    </div>
  )
}
