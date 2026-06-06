// src/app/dashboard/clients/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, Search, Phone, Mail, ChevronRight, Globe, FileUser, UserSquare2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { ErrorTracker } from '@/lib/observability/errors'
import { ClientCreateModal } from './ClientCreateModal'
import { Client360Drawer } from './Client360Drawer'

interface Client {
  id: string; full_name: string; phone: string | null; email: string | null
  type: string; source: string | null; nationality: string | null; created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  buyer:    { color: 'bg-asas-silver/10 text-asas-charcoal dark:text-asas-silver border-asas-silver/20', label: 'Acheteur' },
  seller:   { color: 'bg-asas-navy/10 text-asas-navy dark:text-asas-sand border-asas-navy/20', label: 'Vendeur' },
  investor: { color: 'bg-asas-gold/10 text-asas-gold border-asas-gold/20', label: 'Investisseur' },
  tenant:   { color: 'bg-asas-copper/10 text-asas-copper border-asas-copper/20', label: 'Locataire' },
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total,   setTotal]   = useState(0)
  const [search,  setSearch]  = useState('')
  const [type,    setType]    = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

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
    <div className="flex-1 font-sans text-white flex flex-col pt-4">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-2 hidden sm:flex">
              <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400 uppercase font-bold tracking-widest flex items-center gap-1">
                 <Users className="w-3 h-3" />
                 <span>Customer 360 Active</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
               Customer 360°
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#D4A64F] mt-2 flex items-center gap-2 hidden sm:flex">
              <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-asas-gold opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-asas-gold"></span>
              </span>
              HubSpot Sync • {total} identités enregistrées
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4A64F] hover:bg-[#E0B96B] text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(212,166,79,0.3)] hover:shadow-[0_0_20px_rgba(212,166,79,0.5)] shrink-0">
            <Plus className="h-4 w-4" strokeWidth={2} /> Nouveau Profil
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input type="text" placeholder="Rechercher entité..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-asas-gold focus:ring-1 focus:ring-asas-gold transition-all placeholder:text-white/30 shadow-sm" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-5 py-3 text-sm font-medium border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:border-asas-gold focus:ring-1 focus:ring-asas-gold transition-all appearance-none pr-10 relative cursor-pointer min-w-[160px] shadow-sm">
            <option value="" className="bg-[#0A1629]">Tous les gabarits</option>
            <option value="buyer" className="bg-[#0A1629]">Acheteur</option>
            <option value="seller" className="bg-[#0A1629]">Vendeur</option>
            <option value="investor" className="bg-[#0A1629]">Investisseur</option>
            <option value="tenant" className="bg-[#0A1629]">Locataire</option>
          </select>
        </div>

        {/* Data */}
        <div className="bg-[#051121] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/50">
               <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <FileUser className="h-10 w-10 text-asas-gold" />
               </div>
              <p className="font-bold text-white text-lg uppercase tracking-widest font-display">Base de données vide</p>
              <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Ajustez vos filtres d'investigation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0A1829] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-white/40">Profil</th>
                    <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-white/40">Canal</th>
                    <th className="hidden sm:table-cell px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-white/40">Type</th>
                    <th className="hidden md:table-cell px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-white/40">Source</th>
                    <th className="hidden lg:table-cell px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-white/40">Localité</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                  {clients.map((c, i) => {
                     const cfg = TYPE_CONFIG[c.type] ?? { color: 'bg-white/5 border-white/10 text-white/80', label: c.type };
                     return (
                        <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={c.id} 
                        onClick={() => setSelectedClientId(c.id)}
                        className="hover:bg-white/[0.02] group cursor-pointer transition-colors"
                        >
                        {/* Name */}
                        <td className="px-6 py-5">
                           <p className="text-sm font-bold text-white group-hover:text-asas-gold transition-colors">{c.full_name}</p>
                           <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1.5 font-mono">ID: {c.id.slice(0, 8)}</p>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-5 space-y-2">
                           {c.phone && (
                              <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 text-xs font-bold text-white/80 hover:text-[#25D366] transition-colors w-fit p-1 -m-1">
                                <Phone className="h-3.5 w-3.5 text-white/30" />{c.phone}
                              </a>
                           )}
                           {c.email && (
                              <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 text-xs font-bold text-white/80 hover:text-asas-gold transition-colors w-fit p-1 -m-1">
                                <Mail className="h-3.5 w-3.5 text-white/30" />{c.email}
                              </a>
                           )}
                           {!c.phone && !c.email && <span className="text-xs text-white/30">—</span>}
                        </td>

                        {/* Type */}
                        <td className="hidden sm:table-cell px-6 py-5 align-middle">
                           <span className={clsx('px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-lg border', cfg.color)}>
                              {cfg.label}
                           </span>
                        </td>

                        {/* Source */}
                        <td className="hidden md:table-cell px-6 py-5 text-[9px] uppercase tracking-widest font-bold text-white/50 align-middle">
                           {c.source || <span className="text-white/20">—</span>}
                        </td>

                        {/* Nationality */}
                        <td className="hidden lg:table-cell px-6 py-5 align-middle">
                           <div className="flex items-center gap-3">
                              {c.nationality ? (
                                 <>
                                    <Globe className="h-4 w-4 text-white/30" />
                                    <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{c.nationality}</span>
                                 </>
                              ) : <span className="text-white/20">—</span>}
                           </div>
                        </td>

                        <td className="pr-6 align-middle text-right">
                           <ChevronRight className="h-5 w-5 text-white/20 transition-transform group-hover:text-asas-gold group-hover:translate-x-1" />
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
      <Client360Drawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  )
}
