'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { KeySessionCard } from './KeySessionCard'
import { Building2, Search, Settings2, PenTool, CheckCircle2 } from 'lucide-react'
import type { Deal } from '@/types/app'

export function SAVOverview() {
  const [closedDeals, setClosedDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const loadDeals = async () => {
    try {
      const res = await fetch('/api/deals?status=closed')
      if (res.ok) {
         const data = await res.json()
         setClosedDeals(data.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
  }, [])

  if (loading) {
     return <div className="p-10 text-center text-gray-500 animate-pulse">Synchronisation des chantiers...</div>
  }

  return (
    <div className="w-full space-y-6">
       {/* Top Controls */}
       <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
         <div className="relative w-full max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <input type="text" placeholder="Rechercher par client, lot..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
         </div>
         <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111111]">
              <Settings2 className="w-4 h-4" /> Filtres
           </button>
         </div>
       </div>

       {closedDeals.length === 0 ? (
         <div className="py-20 text-center border border-dashed border-gray-300 dark:border-[#262626] rounded-3xl">
           <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
           <p className="text-gray-500 font-medium">Aucune livraison ou remise de clés en attente.</p>
           <p className="text-xs text-gray-400 mt-2">Dès qu'une transaction est marquée "Closed", elle apparaîtra ici pour la phase SAV.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closedDeals.map(deal => (
               <KeySessionCard key={deal.id} deal={deal} onUpdate={loadDeals} />
            ))}
         </div>
       )}
    </div>
  )
}
