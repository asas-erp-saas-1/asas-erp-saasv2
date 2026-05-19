// src/app/dashboard/clients/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, Search, Phone, Mail, ChevronRight, Globe, FileUser } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { ErrorTracker } from '@/lib/observability/errors'
import { ClientCreateModal } from './ClientCreateModal'

interface Client {
  id: string; full_name: string; phone: string | null; email: string | null
  type: string; source: string | null; nationality: string | null; created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  buyer:    { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Acheteur' },
  seller:   { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Vendeur' },
  investor: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Investisseur' },
  tenant:   { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Locataire' },
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total,   setTotal]   = useState(0)
  const [search,  setSearch]  = useState('')
  const [type,    setType]    = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadClients = () => {
    const params = new URLSearchParams({ limit: '50' })
    if (search) params.set('q', search)
    if (type)   params.set('type', type)
    setLoading(true)
    fetch(`/api/clients?${params}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text() || 'Failed to fetch clients');
        return r.json();
      })
      .then(d => { setClients(d.data ?? []); setTotal(d.count ?? 0) })
      .catch(err => {
        ErrorTracker.captureError(err, { context: 'ClientsPage fetch' });
        setClients([]);
        setTotal(0);
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadClients()
  }, [search, type])

  return (
    <div className="flex-1 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-black/5 dark:border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-display">
               <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                   <Users className="h-6 w-6 text-gray-900 dark:text-white" /> 
               </div>
               Base Clients
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-2">{total} identités enregistrées</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.02] active:scale-95">
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Nouveau Profil
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Rechercher entité..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-black/10 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-5 py-3 text-sm font-medium border border-black/10 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none pr-10 relative cursor-pointer min-w-[160px]">
            <option value="">Tous les gabarits</option>
            <option value="buyer">Acheteur</option>
            <option value="seller">Vendeur</option>
            <option value="investor">Investisseur</option>
            <option value="tenant">Locataire</option>
          </select>
        </div>

        {/* Data */}
        <div className="bg-gray-50 dark:bg-[#050505] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
               <div className="w-20 h-20 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <FileUser className="h-10 w-10 text-gray-600" />
               </div>
              <p className="font-extrabold text-gray-900 dark:text-white text-lg">Base de données vide</p>
              <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Ajustez vos filtres d'investigation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white dark:bg-[#0A0A0A] border-b border-black/5 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-gray-500">Profil</th>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-gray-500">Canal</th>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-gray-500">Type</th>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-gray-500">Source</th>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-gray-500">Localité</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                  {clients.map((c, i) => {
                     const cfg = TYPE_CONFIG[c.type] ?? { color: 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-300', label: c.type };
                     return (
                        <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={c.id} 
                        className="hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 group cursor-pointer transition-colors"
                        >
                        {/* Name */}
                        <td className="px-6 py-5">
                           <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors">{c.full_name}</p>
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 font-mono">ID: {c.id.slice(0, 8)}</p>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-5 space-y-2">
                           {c.phone && <div className="flex items-center gap-3 text-xs font-bold text-gray-800 dark:text-gray-300"><Phone className="h-3.5 w-3.5 text-gray-500" />{c.phone}</div>}
                           {c.email && <div className="flex items-center gap-3 text-xs font-bold text-gray-800 dark:text-gray-300"><Mail className="h-3.5 w-3.5 text-gray-500" />{c.email}</div>}
                           {!c.phone && !c.email && <span className="text-xs text-gray-600">—</span>}
                        </td>

                        {/* Type */}
                        <td className="px-6 py-5 align-middle">
                           <span className={clsx('px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg border', cfg.color)}>
                              {cfg.label}
                           </span>
                        </td>

                        {/* Source */}
                        <td className="px-6 py-5 text-[10px] uppercase tracking-widest font-bold text-gray-600 dark:text-gray-400 align-middle">
                           {c.source || <span className="text-gray-600">—</span>}
                        </td>

                        {/* Nationality */}
                        <td className="px-6 py-5 align-middle">
                           <div className="flex items-center gap-3">
                              {c.nationality ? (
                                 <>
                                    <Globe className="h-4 w-4 text-gray-500" />
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-widest">{c.nationality}</span>
                                 </>
                              ) : <span className="text-gray-600">—</span>}
                           </div>
                        </td>

                        <td className="pr-6 align-middle text-right">
                           <ChevronRight className="h-5 w-5 text-gray-600 transition-transform group-hover:text-gray-900 dark:text-white group-hover:translate-x-1" />
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
      {isModalOpen && (
        <ClientCreateModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false)
            loadClients()
          }}
        />
      )}
    </div>
  )
}
