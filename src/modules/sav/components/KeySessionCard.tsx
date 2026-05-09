'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { MapPin, KeyRound, Wrench, CheckCircle2, ChevronRight } from 'lucide-react'
import type { Deal } from '@/types/app'
import Link from 'next/link'
import { SAVPanelModal } from './SAVPanelModal'

export function KeySessionCard({ deal, onUpdate }: { deal: Deal, onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const clientName = deal.clients?.full_name || 'Client Inconnu'
  const project = deal.properties?.projects?.name || 'Projet Indéfini'
  const ref = deal.properties?.reference_code || '---'

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl hover:border-indigo-500/30 transition-colors group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start justify-between mb-4">
           <div>
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md mb-2 inline-block">
               Livraison & SAV
             </span>
             <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">{clientName}</h3>
           </div>
           <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#111111] border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
              <KeyRound className="w-5 h-5 text-gray-500 group-hover:text-indigo-500 transition-colors" />
           </div>
        </div>

        <div className="space-y-2 mb-6">
           <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
             <MapPin className="w-3 h-3" /> {project}
           </p>
           <p className="text-xs font-bold text-gray-500 flex items-center gap-2 font-mono">
             <Wrench className="w-3 h-3" /> Lot: {ref}
           </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
           <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
             <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Réserves en attente
           </div>
           <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </div>
      </motion.div>

      {isModalOpen && (
        <SAVPanelModal deal={deal} onClose={() => setIsModalOpen(false)} onUpdate={onUpdate} />
      )}
    </>
  )
}
