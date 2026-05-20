'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Loader2, FileText, CheckCircle2, MapPin, Download, MessageCircle, Building2, Wallet } from 'lucide-react'
import { clsx } from 'clsx'
import type { Deal } from '@/types/app'
import Link from 'next/link'

export default function CustomerPortal({ params }: { params: { deal_id: string } }) {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/deals?id=${params.deal_id}`)
      .then(res => res.json())
      .then(d => {
        setDeal(d.data?.[0] || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.deal_id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#000000] text-white">
        <h1 className="text-2xl font-bold mb-2">Accès restreint</h1>
        <p className="text-gray-400">Le dossier demandé n'existe pas ou est sécurisé.</p>
      </div>
    )
  }

  const price = (deal as any).agreed_price || 0
  const paid = (deal as any).total_payments_received || 0
  const pct = price > 0 ? (paid / price) * 100 : 0

  return (
    <div className="min-h-screen w-full bg-[#141618] text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#141618]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
               <span className="text-black font-black text-xl tracking-tighter leading-none">A</span>
            </div>
            <span className="font-extrabold tracking-tight text-lg">ASAS</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full">
            Espace Acquéreur
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Intro */}
        <section>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2"
          >
            Bienvenue, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{deal.clients?.full_name}</span>.
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-gray-400 font-medium max-w-2xl"
          >
            Suivez l'avancement de votre acquisition immobilière, gérez vos appels de fonds et accédez à l'ensemble de vos documents contractuels dans cet espace sécurisé.
          </motion.p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Propriété */}
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="md:col-span-2 bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="flex items-start gap-4 mb-8 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold">{deal.properties?.projects?.name || 'Programme Immobilier'}</h2>
                   <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                     <MapPin className="w-3 h-3" /> Lot {deal.properties?.reference_code || '---'}
                   </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                 <div className="bg-[#141618] border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Type</p>
                    <p className="font-bold text-sm">{deal.properties?.type || 'Appartement'}</p>
                 </div>
                 <div className="bg-[#111111] border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Surface</p>
                    <p className="font-bold text-sm">{deal.properties?.area_sqm ? `${deal.properties.area_sqm} m²` : '---'}</p>
                 </div>
                 <div className="bg-[#111111] border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Pièces</p>
                    <p className="font-bold text-sm">{deal.properties?.rooms || '---'}</p>
                 </div>
                 <div className="bg-[#111111] border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Livraison</p>
                    <p className="font-bold text-sm">T4 2026</p>
                 </div>
              </div>
           </motion.div>

           {/* Contact Agent */}
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl flex flex-col justify-between"
           >
              <div>
                <p className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">Votre Conseiller ASAS</p>
                <p className="text-lg font-bold">{deal.profiles?.full_name || 'Équipe Commerciale'}</p>
                <p className="text-sm text-gray-400 mt-1">À votre disposition pour toute question concernant votre dossier.</p>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/213000000000`, '_blank')} // Fallback agent number
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl font-bold text-sm transition-colors active:scale-95"
              >
                 <MessageCircle className="w-4 h-4" /> Message WhatsApp
              </button>
           </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Finance */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl"
          >
             <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Wallet className="w-5 h-5 text-indigo-400" /> Échéancier Financier
             </h3>
             <div className="mb-8">
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <p className="text-3xl font-black">{(paid / 1000000).toFixed(1)} <span className="text-sm text-gray-500">M DZD</span></p>
                   <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Payé sur {(price / 1000000).toFixed(1)} M</p>
                 </div>
                 <div className="text-xl font-bold text-indigo-400">{pct.toFixed(0)}%</div>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
               </div>
             </div>

             <div className="space-y-3">
               {(!deal.deal_payments || deal.deal_payments.length === 0) ? (
                  <p className="text-sm text-gray-400">Aucun paiement ou appel de fonds enregistré.</p>
               ) : (
                  (deal.deal_payments as any[]).sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map(payment => (
                     <div key={payment.id} className={clsx("flex items-center justify-between p-4 rounded-xl border transition-colors", payment.status === 'paid' ? "bg-[#111111] border-white/5" : "bg-[#0A0A0A] border-white/5 opacity-50")}>
                        <div className="flex items-center gap-3">
                           {payment.status === 'paid' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-600" />}
                           <div>
                             <p className="text-sm font-bold">Appel de Fonds</p>
                             <p className="text-[10px] uppercase text-gray-500 tracking-wider">
                                {payment.status === 'paid' ? `Réglé le ${new Date(payment.updated_at || payment.due_date).toLocaleDateString()}` : `Prévu pour le ${new Date(payment.due_date).toLocaleDateString()}`}
                             </p>
                           </div>
                        </div>
                        <span className={clsx("text-sm font-bold", payment.status === 'paid' ? "text-white" : "text-gray-400")}>{((payment.amount) / 1000000).toFixed(2)} M</span>
                     </div>
                  ))
               )}
             </div>
          </motion.section>

          {/* Section Documents GED */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl"
          >
             <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-indigo-400" /> Documents & Contrats
             </h3>
             <div className="space-y-4">
                {[
                  { name: 'Contrat de Réservation', status: 'Signé', id: 'res' },
                  { name: 'Plans de Masse & Intérieur', status: 'Disponible', id: 'plan' },
                  { name: 'Appel de fonds N°1', status: 'Réglé', id: 'app1' }
                ].map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors cursor-pointer group">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold group-hover:text-white">{doc.name}</p>
                          <p className="text-[10px] uppercase text-gray-400 tracking-widest">{doc.status}</p>
                        </div>
                     </div>
                     <Download className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                ))}
             </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
