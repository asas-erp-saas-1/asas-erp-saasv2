// src/app/dashboard/clients/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, Search, Phone, Mail, ChevronRight, Globe, FileUser } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'

interface Client {
  id: string; full_name: string; phone: string | null; email: string | null
  type: string; source: string | null; nationality: string | null; created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  buyer:    { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Acheteur' },
  seller:   { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Vendeur' },
  investor: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Investisseur' },
  tenant:   { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Locataire' },
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total,   setTotal]   = useState(0)
  const [search,  setSearch]  = useState('')
  const [type,    setType]    = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' })
    if (search) params.set('q', search)
    if (type)   params.set('type', type)
    setLoading(true)
    fetch(`/api/clients?${params}`)
      .then(r => r.json())
      .then(d => { setClients(d.data ?? []); setTotal(d.count ?? 0) })
      .finally(() => setLoading(false))
  }, [search, type])

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                   <Users className="h-5 w-5 text-blue-600" /> 
               </div>
               Base Clients
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-2">{total} clients enregistrés dans le CRM</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1A2A4A] text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:bg-[#243554] hover:shadow focus:outline-none focus:ring-4 focus:ring-[#1A2A4A]/20">
            <Plus className="h-4 w-4" /> Nouveau client
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher par nom, téléphone, email…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none pr-10 relative cursor-pointer min-w-[160px]">
            <option value="">Tous les types</option>
            <option value="buyer">Acheteur</option>
            <option value="seller">Vendeur</option>
            <option value="investor">Investisseur</option>
            <option value="tenant">Locataire</option>
          </select>
        </div>

        {/* Data */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FileUser className="h-10 w-10 text-gray-300" />
               </div>
              <p className="font-bold text-gray-900">Aucun client trouvé</p>
              <p className="text-sm mt-1">Essayez de modifier vos filtres ou ajoutez un nouveau client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Client</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Coordonnées</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Type</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Source</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Nationalité</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                  {clients.map((c, i) => {
                     const cfg = TYPE_CONFIG[c.type] ?? { color: 'bg-gray-100 text-gray-700 border-gray-200', label: c.type };
                     return (
                        <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={c.id} 
                        className="hover:bg-gray-50 group cursor-pointer transition-colors"
                        >
                        {/* Name */}
                        <td className="px-6 py-5">
                           <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{c.full_name}</p>
                           <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">ID: {c.id.slice(0, 8)}</p>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-5 space-y-2">
                           {c.phone && <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Phone className="h-3.5 w-3.5 text-gray-400" />{c.phone}</div>}
                           {c.email && <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Mail className="h-3.5 w-3.5 text-gray-400" />{c.email}</div>}
                           {!c.phone && !c.email && <span className="text-xs text-gray-400">—</span>}
                        </td>

                        {/* Type */}
                        <td className="px-6 py-5 align-middle">
                           <span className={clsx('px-2.5 py-1 text-[10px] font-bold rounded-lg border', cfg.color)}>
                              {cfg.label}
                           </span>
                        </td>

                        {/* Source */}
                        <td className="px-6 py-5 text-sm font-medium text-gray-600 capitalize align-middle">
                           {c.source || <span className="text-gray-300">—</span>}
                        </td>

                        {/* Nationality */}
                        <td className="px-6 py-5 align-middle">
                           <div className="flex items-center gap-2">
                              {c.nationality ? (
                                 <>
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">{c.nationality}</span>
                                 </>
                              ) : <span className="text-gray-300">—</span>}
                           </div>
                        </td>

                        <td className="pr-6 align-middle text-right">
                           <ChevronRight className="h-5 w-5 text-gray-300 transition-transform group-hover:text-blue-500 group-hover:translate-x-1" />
                        </td>
                        </motion.tr>
                     )
                   })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
