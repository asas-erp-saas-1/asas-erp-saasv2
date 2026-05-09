// src/app/dashboard/properties/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { Building2, Plus, Search, Filter, CheckCircle, XCircle, Clock, Tag } from 'lucide-react'
import { clsx } from 'clsx'
import { PropertyCreateModal } from './PropertyCreateModal'

interface Property {
  id: string; reference_code: string | null; type: string; rooms: string | null
  area_sqm: number | null; list_price: number; status: string
  images: string[]; notes: string | null; created_at: string
  projects: { id: string; name: string; city: string | null; developers: { name: string } | null } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  available: { label: 'Disponible', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  reserved:  { label: 'Réservé',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  sold:      { label: 'Vendu',      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: CheckCircle },
  off_market:{ label: 'Retiré',     color: 'bg-red-500/10 text-red-400 border-red-500/20',      icon: XCircle },
}

const TYPE_LABELS: Record<string, string> = {
  f2:'F2', f3:'F3', f4:'F4', f5:'F5', villa:'Villa', duplex:'Duplex', studio:'Studio', commercial:'Commerce', land:'Terrain', other:'Autre',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M DZD'
  return new Intl.NumberFormat('fr-DZ').format(n)+' DZD'
}

function PropertyCard({ property }: { property: Property }) {
  const cfg = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.available!
  const StatusIcon = cfg.icon
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-gray-50 dark:bg-[#050505] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl hover:border-black/10 dark:border-white/10 transition-all group"
    >
      {/* Image placeholder */}
      <div className="h-48 bg-white dark:bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
        {property.images?.[0] ? (
          <Image src={property.images[0]} alt="Property image" fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        ) : (
          <Building2 className="h-12 w-12 text-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
        <span className={clsx('absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-md border text-[10px] uppercase tracking-widest font-bold shadow-sm backdrop-blur-md', cfg.color)}>
           <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 shadow-[0_0_10px_currentColor]" />
          {cfg.label}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{TYPE_LABELS[property.type] ?? property.type}</span>
            {property.reference_code && <span className="ml-2 text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-md">#{property.reference_code}</span>}
          </div>
          {property.rooms && <span className="text-[10px] bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white px-2 py-0.5 rounded-md font-bold">{property.rooms}</span>}
        </div>

        <p className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-white mb-4">{fmt(property.list_price)}</p>

        {property.projects && (
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate flex items-center gap-2 mb-4 bg-white dark:bg-[#0A0A0A] p-2 border border-black/5 dark:border-white/5 rounded-lg">
            <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="truncate">{property.projects.name}</span>
            {property.projects.city ? <span className="text-gray-600 shrink-0">· {property.projects.city}</span> : ''}
          </p>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-black/5 dark:border-white/5 text-[10px] uppercase tracking-widest font-bold text-gray-500">
          {property.area_sqm && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />{property.area_sqm} m²</span>}
          {property.projects?.developers && <span className="flex items-center gap-1.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />{property.projects.developers.name}</span>}
        </div>
      </div>
    </motion.div>
  )
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total,      setTotal]       = useState(0)
  const [loading,    setLoading]     = useState(true)
  const [search,     setSearch]      = useState('')
  const [statusFilter, setStatus]    = useState('')
  const [typeFilter,   setType]      = useState('')
  const [page,       setPage]        = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const LIMIT = 24

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter)   params.set('type',   typeFilter)
      if (search)       params.set('q',      search)

      const res  = await fetch(`/api/properties?${params}`)
      if (!res.ok) throw new Error(await res.text() || 'Failed to open properties')
      const data = await res.json()
      setProperties(data.data ?? [])
      setTotal(data.count ?? 0)
    } catch (e: any) {
      import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(e, { context: 'PropertiesPage load' }))
    } finally { setLoading(false) }
  }, [page, statusFilter, typeFilter, search])

  useEffect(() => { load() }, [load])

  const statsByStatus = ['available', 'reserved', 'sold'].reduce((acc, s) => ({
    ...acc, [s]: properties.filter(p => p.status === s).length,
  }), {} as Record<string, number>)

  return (
    <div className="flex-1 text-gray-900 dark:text-gray-100 flex flex-col">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 tracking-tight flex items-center gap-3 font-display">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-emerald-500/10 border border-black/10 dark:border-white/10 flex items-center justify-center p-3 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                 <Building2 className="h-full w-full text-blue-400" /> 
              </div>
              OS Nexus | Gestion des Actifs
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Moteur 3D temps réel synchronisé
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-3 shrink-0 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-blue-400 rounded-xl text-xs font-bold hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 transition-all">
              Générer Rapport IA
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-3 object-cover shrink-0 bg-blue-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.02] active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Nouvel Actif
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: 'Unité Disponible', key: 'available', color: 'text-emerald-400 bg-[#050A05] border-emerald-500/20' },
            { label: 'Processus de Réservation',    key: 'reserved',  color: 'text-amber-400 bg-[#0A0500] border-amber-500/20' },
            { label: 'Acquisition Clôturée',  key: 'sold',       color: 'text-blue-400 bg-[#00050A] border-blue-500/20' },
          ].map(s => (
            <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} key={s.key} className={clsx('rounded-2xl border p-6 relative overflow-hidden', s.color)}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Building2 className="w-16 h-16" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tighter mb-2 relative z-10">{statsByStatus[s.key] ?? 0}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 relative z-10">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0A0A0A] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-2xl">
           <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" placeholder="Scanner matricule X-001..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50 dark:bg-[#050505] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all font-medium placeholder:text-gray-600" />
             </div>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-48">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
                 <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 text-sm bg-gray-50 dark:bg-[#050505] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white transition-all font-medium appearance-none cursor-pointer">
                    <option value="">Tous les statuts</option>
                    <option value="available">Disponible</option>
                    <option value="reserved">Réservé</option>
                    <option value="sold">Vendu</option>
                </select>
               </div>
               
               <div className="relative flex-1 md:w-48">
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
                 <select value={typeFilter} onChange={e => setType(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 text-sm bg-gray-50 dark:bg-[#050505] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white transition-all font-medium appearance-none cursor-pointer">
                    <option value="">Tous les gabarits</option>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
               </div>
           </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-80 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-black/5 dark:border-white/5 animate-pulse" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500 bg-white dark:bg-[#0A0A0A] rounded-3xl border border-black/5 dark:border-white/5 border-dashed">
            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
               <Building2 className="h-8 w-8 text-white/50" />
            </div>
             <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Base de données vide</p>
             <p className="text-xs uppercase tracking-widest">Ajustez vos paramètres régionaux ou d'état.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p, i) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-5 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl disabled:opacity-40 hover:text-gray-900 dark:text-white transition-colors">← Précédent</button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white dark:bg-[#0A0A0A] px-4 py-3 rounded-xl border border-black/5 dark:border-white/5">Page {page} / {Math.ceil(total/LIMIT)}</span>
            <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => setPage(p => p+1)} className="px-5 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl disabled:opacity-40 hover:text-gray-900 dark:text-white transition-colors">Suivant →</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <PropertyCreateModal 
             onClose={() => setIsCreateModalOpen(false)} 
             onSuccess={() => { setIsCreateModalOpen(false); load() }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
