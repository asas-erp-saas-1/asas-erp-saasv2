// src/app/dashboard/properties/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Building2, Plus, Search, Filter, CheckCircle, XCircle, Clock, Tag } from 'lucide-react'
import { clsx } from 'clsx'

interface Property {
  id: string; reference_code: string | null; type: string; rooms: string | null
  area_sqm: number | null; list_price: number; status: string
  images: string[]; notes: string | null; created_at: string
  projects: { id: string; name: string; city: string | null; developers: { name: string } | null } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  available: { label: 'Disponible', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  reserved:  { label: 'Réservé',    color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  sold:      { label: 'Vendu',      color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: CheckCircle },
  off_market:{ label: 'Retiré',     color: 'bg-red-100 text-red-700 border-red-200',      icon: XCircle },
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
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all"
    >
      {/* Image placeholder */}
      <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center relative overflow-hidden group">
        {property.images?.[0] ? (
          <Image src={property.images[0]} alt="Property image" fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" referrerPolicy="no-referrer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        ) : (
          <Building2 className="h-12 w-12 text-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className={clsx('absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold shadow-sm backdrop-blur-md', cfg.color)}>
           <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          {cfg.label}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-bold text-gray-400 object-cover uppercase tracking-wider">{TYPE_LABELS[property.type] ?? property.type}</span>
            {property.reference_code && <span className="ml-2 text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">#{property.reference_code}</span>}
          </div>
          {property.rooms && <span className="text-[10px] bg-blue-50/80 border border-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold">{property.rooms}</span>}
        </div>

        <p className="font-extrabold text-2xl tracking-tight text-gray-900">{fmt(property.list_price)}</p>

        {property.projects && (
          <p className="text-sm font-medium text-gray-600 mt-2 truncate flex items-center gap-1">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            {property.projects.name}
            {property.projects.city ? ` · ${property.projects.city}` : ''}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs font-semibold text-gray-500">
          {property.area_sqm && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />{property.area_sqm} m²</span>}
          {property.projects?.developers && <span className="flex items-center gap-1.5 truncate"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />{property.projects.developers.name}</span>}
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
  const LIMIT = 24

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter)   params.set('type',   typeFilter)
      if (search)       params.set('q',      search)

      const res  = await fetch(`/api/properties?${params}`)
      const data = await res.json()
      setProperties(data.data ?? [])
      setTotal(data.count ?? 0)
    } finally { setLoading(false) }
  }, [page, statusFilter, typeFilter, search])

  useEffect(() => { load() }, [load])

  const statsByStatus = ['available', 'reserved', 'sold'].reduce((acc, s) => ({
    ...acc, [s]: properties.filter(p => p.status === s).length,
  }), {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                 <Building2 className="h-5 w-5 text-blue-600" /> 
              </div>
              Projets & Propriétés
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-2">Gérez l'inventaire, le statut et la disponibilité des biens immobiliers.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 shrink-0 bg-[#1A2A4A] text-white rounded-xl text-sm font-semibold hover:bg-[#243554] shadow-sm hover:shadow-md transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Ajouter Un Bien
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Biens Disponibles', key: 'available', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
            { label: 'En Réservation',    key: 'reserved',  color: 'text-amber-700 bg-amber-50 border-amber-100' },
            { label: 'Propriétés Vendues',  key: 'sold',       color: 'text-blue-700 bg-blue-50 border-blue-100' },
          ].map(s => (
            <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} key={s.key} className={clsx('rounded-2xl border p-5', s.color)}>
              <p className="text-4xl font-extrabold tracking-tight mb-1">{statsByStatus[s.key] ?? 0}</p>
              <p className="text-sm font-semibold opacity-90">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Recherche par référence..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2A4A]/20 transition-all font-medium placeholder:font-normal" />
             </div>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                 <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                    className="pl-10 pr-8 py-2 text-sm bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2A4A]/20 transition-all font-medium appearance-none cursor-pointer">
                    <option value="">Tous les statuts</option>
                    <option value="available">Disponible</option>
                    <option value="reserved">Réservé</option>
                    <option value="sold">Vendu</option>
                </select>
               </div>
               
               <div className="relative">
                 <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                 <select value={typeFilter} onChange={e => setType(e.target.value)}
                    className="pl-10 pr-8 py-2 text-sm bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2A4A]/20 transition-all font-medium appearance-none cursor-pointer">
                    <option value="">Tous les types</option>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
               </div>
           </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <Building2 className="h-10 w-10 text-gray-300" />
            </div>
             <p className="text-lg font-bold text-gray-900 mb-1">Aucune propriété trouvée</p>
             <p className="text-sm">Ajustez vos filtres de recherche ou ajoutez un nouveau bien.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p, i) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-sm">← Précédent</button>
            <span className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">Page {page} / {Math.ceil(total/LIMIT)}</span>
            <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => setPage(p => p+1)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-sm">Suivant →</button>
          </div>
        )}
      </div>
    </div>
  )
}
