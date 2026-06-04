// src/app/dashboard/clients/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, Search, Phone, Mail, ChevronRight, Globe, FileUser } from 'lucide-react'
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
    <div className="flex-1 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-bold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-4 font-display uppercase">
               <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-asas-gold/20 to-asas-gold/10 border border-asas-gold/30 flex items-center justify-center shadow-lg">
                   <Users className="h-7 w-7 text-asas-gold" /> 
               </div>
               Portefeuille Client
            </h1>
            <p className="text-xs uppercase tracking-widest font-semibold text-asas-silver/70 mt-3">{total} identités enregistrées · Gestion centralisée</p>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-6 py-3 bg-asas-gold hover:bg-asas-gold/90 text-asas-charcoal font-bold rounded-lg text-sm transition-all transform shadow-lg hover:shadow-xl border border-asas-gold/40">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nouveau Profil
          </motion.button>
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-asas-silver/60" />
            <input type="text" placeholder="Rechercher entité, contact..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-white/20 dark:border-white/10 rounded-lg bg-white/50 dark:bg-white/5 text-asas-charcoal dark:text-asas-sand focus:outline-none focus:border-asas-gold focus:ring-2 focus:ring-asas-gold/30 transition-all placeholder:text-asas-silver/50" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-5 py-3 text-sm font-medium border border-white/20 dark:border-white/10 rounded-lg bg-white/50 dark:bg-white/5 text-asas-charcoal dark:text-asas-sand focus:outline-none focus:border-asas-gold focus:ring-2 focus:ring-asas-gold/30 transition-all appearance-none pr-10 relative cursor-pointer min-w-[180px]">
            <option value="">Tous les profils</option>
            <option value="buyer">Acheteur</option>
            <option value="seller">Vendeur</option>
            <option value="investor">Investisseur</option>
            <option value="tenant">Locataire</option>
          </select>
        </motion.div>

        {/* Data */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#141618] rounded-lg border border-white/10 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="h-20 bg-gradient-to-r from-white/30 dark:from-white/5 to-white/10 dark:to-white/[0.02] border border-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-asas-silver">
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-gradient-to-br from-asas-gold/10 to-asas-gold/5 border border-asas-gold/20 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                  <FileUser className="h-12 w-12 text-asas-gold" />
               </motion.div>
              <p className="font-bold text-asas-charcoal dark:text-asas-sand text-xl uppercase tracking-wide font-display">Aucun profil trouvé</p>
              <p className="text-sm text-asas-silver/60 uppercase font-semibold tracking-wider mt-2">Ajustez vos critères de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gradient-to-r from-white/50 to-white/30 dark:from-white/5 dark:to-white/[0.02] border-b border-white/10">
                  <tr>
                    <th className="px-6 py-5 text-xs uppercase font-bold tracking-wider text-asas-charcoal dark:text-asas-sand/80">Profil</th>
                    <th className="px-6 py-5 text-xs uppercase font-bold tracking-wider text-asas-charcoal dark:text-asas-sand/80">Canal</th>
                    <th className="hidden sm:table-cell px-6 py-5 text-xs uppercase font-bold tracking-wider text-asas-charcoal dark:text-asas-sand/80">Type</th>
                    <th className="hidden md:table-cell px-6 py-5 text-xs uppercase font-bold tracking-wider text-asas-charcoal dark:text-asas-sand/80">Source</th>
                    <th className="hidden lg:table-cell px-6 py-5 text-xs uppercase font-bold tracking-wider text-asas-charcoal dark:text-asas-sand/80">Localité</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <AnimatePresence>
                  {clients.map((c, i) => {
                     const cfg = TYPE_CONFIG[c.type] ?? { color: 'bg-white/5 dark:bg-white/5 border-white/20 text-asas-charcoal dark:text-asas-sand/80', label: c.type };
                     return (
                        <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={c.id} 
                        onClick={() => setSelectedClientId(c.id)}
                        className="hover:bg-white/50 dark:hover:bg-white/5 group cursor-pointer transition-colors border-b border-white/5"
                        >
                        {/* Name */}
                        <td className="px-6 py-5">
                           <p className="text-sm font-bold text-asas-charcoal dark:text-asas-sand group-hover:text-asas-gold transition-colors">{c.full_name}</p>
                           <p className="text-[9px] text-asas-silver font-bold uppercase tracking-widest mt-1.5 font-mono">ID: {c.id.slice(0, 8)}</p>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-5 space-y-2">
                           {c.phone && (
                              <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 text-xs font-bold text-asas-charcoal dark:text-asas-sand hover:text-[#25D366] transition-colors w-fit p-1 -m-1">
                                <Phone className="h-3.5 w-3.5 text-asas-silver" />{c.phone}
                              </a>
                           )}
                           {c.email && (
                              <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 text-xs font-bold text-asas-charcoal dark:text-asas-sand hover:text-asas-gold transition-colors w-fit p-1 -m-1">
                                <Mail className="h-3.5 w-3.5 text-asas-silver" />{c.email}
                              </a>
                           )}
                           {!c.phone && !c.email && <span className="text-xs text-asas-silver">—</span>}
                        </td>

                        {/* Type */}
                        <td className="hidden sm:table-cell px-6 py-5 align-middle">
                           <span className={clsx('px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-sm border', cfg.color)}>
                              {cfg.label}
                           </span>
                        </td>

                        {/* Source */}
                        <td className="hidden md:table-cell px-6 py-5 text-[9px] uppercase tracking-widest font-bold text-asas-silver align-middle">
                           {c.source || <span className="text-asas-silver/50">—</span>}
                        </td>

                        {/* Nationality */}
                        <td className="hidden lg:table-cell px-6 py-5 align-middle">
                           <div className="flex items-center gap-3">
                              {c.nationality ? (
                                 <>
                                    <Globe className="h-4 w-4 text-asas-silver" />
                                    <span className="text-xs font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-widest">{c.nationality}</span>
                                 </>
                              ) : <span className="text-asas-silver/50">—</span>}
                           </div>
                        </td>

                        <td className="pr-6 align-middle text-right">
                           <ChevronRight className="h-5 w-5 text-asas-silver transition-transform group-hover:text-asas-gold group-hover:translate-x-1" />
                        </td>
                        </motion.tr>
                     )
                   })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
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
