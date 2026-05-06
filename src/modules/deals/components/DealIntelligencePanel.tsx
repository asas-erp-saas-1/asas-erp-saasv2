// src/modules/deals/components/DealIntelligencePanel.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, AlertTriangle, User, Building, MapPin, Calculator, Calendar, ArrowUpRight, DollarSign, FileText, CheckSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { ErrorTracker } from '@/lib/observability/errors'
import { jsPDF } from 'jspdf'
import { CreateTaskModal } from '@/app/dashboard/tasks/CreateTaskModal'

export function DealIntelligencePanel({ dealId }: { dealId: string }) {
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/deals?id=${dealId}`)
      .then(r => r.json())
      .then(d => {
        setDeal(d.data?.[0] || d.data || null)
        setLoading(false)
      })
      .catch((err) => {
        ErrorTracker.captureError(err, { context: 'DealIntelligencePanel fetch' })
        setLoading(false)
      })
  }, [dealId])

  const handleGenerateContract = () => {
    if (!deal) return
    const doc = new jsPDF()
    const clientName = deal.clients?.full_name || 'Client Inconnu'
    const propertyRef = deal.properties?.reference_code || 'N/A'
    const projectName = deal.properties?.projects?.name || 'Projet Inconnu'
    const agreedPrice = deal.agreed_price || deal.amount || 0

    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text("CONTRAT DE RESERVATION (VEFA)", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Identifiant Transaction : ${dealId.substring(0,8).toUpperCase()}`, 20, 40)
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 20, 50)

    doc.setFont("helvetica", "bold")
    doc.text("ENTRE LES SOUSSIGNES :", 20, 70)
    
    doc.setFont("helvetica", "normal")
    doc.text(`ASAS OS Immobilier (Le Promoteur)`, 20, 80)
    doc.text(`Et`, 20, 90)
    doc.text(`Monsieur/Madame ${clientName}`, 20, 100)
    if (deal.clients?.phone) {
       doc.text(`Contact : ${deal.clients.phone}`, 20, 110)
    }

    doc.setFont("helvetica", "bold")
    doc.text("OBJET DU CONTRAT :", 20, 130)
    
    doc.setFont("helvetica", "normal")
    doc.text(`Réservation du lot (Réf: ${propertyRef}) au sein du programme immobilier`, 20, 140)
    doc.text(`"${projectName}".`, 20, 150)

    doc.setFont("helvetica", "bold")
    doc.text("CONDITIONS FINANCIERES :", 20, 170)
    
    doc.setFont("helvetica", "normal")
    doc.text(`Le prix de vente convenu est de : ${(agreedPrice / 1_000_000).toFixed(2)} Millions DZD.`, 20, 180)
    
    doc.text("Signature du Promoteur", 40, 220)
    doc.text("Signature de l'Acquéreur", 130, 220)

    doc.save(`Contrat_Reservation_${propertyRef}.pdf`)
  }

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col justify-center items-center text-gray-600 dark:text-gray-400">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1A2A4A] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium animate-pulse">Chargement de la transaction...</p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <p className="text-gray-500">Transaction introuvable.</p>
      </div>
    )
  }

  const isCritical = deal.risk_level === 'critical' || deal.risk_level === 'high'
  const agreedPrice = deal.agreed_price || deal.amount || 0
  const paymentsReceived = deal.total_payments_received || 0

  return (
          <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 pb-[env(safe-area-inset-bottom)]">
      {/* Header section */}
      <div className="bg-gray-50 dark:bg-[#050505] rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0A0A0A]/50 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">
                Transaction #{dealId.substring(0,8).toUpperCase()}
              </h2>
              <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> Logged by: {deal.profiles?.full_name || 'Système'}
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Réf: {deal.properties?.reference_code || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#171717] border border-black/5 dark:border-white/5 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors shadow-sm whitespace-nowrap active:scale-95">
              <CheckSquare className="w-4 h-4" /> Créer Tâche
            </button>
            <button onClick={handleGenerateContract} className="px-4 py-2 bg-gray-200 dark:bg-[#171717] border border-black/5 dark:border-white/5 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors shadow-sm whitespace-nowrap active:scale-95">
              Générer Contrat (PDF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" /> Montant total convenu
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(agreedPrice / 1_000_000).toFixed(1)} <span className="text-lg text-gray-600 font-medium">M DZD</span>
            </p>
            <div className="mt-3 w-full bg-gray-200 dark:bg-[#171717] h-1.5 rounded-full overflow-hidden">
              <div 
                className={clsx("h-full rounded-full transition-all duration-1000", paymentsReceived >= agreedPrice ? 'bg-emerald-500' : 'bg-blue-500')} 
                style={{ width: `${Math.min((paymentsReceived / (agreedPrice || 1)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {(paymentsReceived / 1_000_000).toFixed(1)}M payé • {((agreedPrice - paymentsReceived) / 1_000_000).toFixed(1)}M restant
            </p>
          </div>
          
          <div className="p-6">
             <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" /> Informations Client
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">{deal.clients?.full_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{deal.clients?.phone}</p>
            <a href="#" className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1 font-medium mt-1">
              Voir profil client <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="p-6">
             <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" /> Propriété & Projet
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">{deal.properties?.projects?.name || 'Projet inconnu'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-500" /> {deal.properties?.reference_code ? `Réf: ${deal.properties.reference_code}` : 'Réf: ---'}
            </p>
            <span className="inline-flex px-2 py-1 bg-gray-200 dark:bg-[#171717] text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/5 text-xs rounded-md font-medium">
              Type: {deal.properties?.property_type || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights & Risk */}
      {isCritical ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 flex gap-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30 backdrop-blur-md">
             <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-bold text-red-400 mb-1">Alerte de Risque Intelligence Artificielle</h3>
            <p className="text-sm text-red-300/80 leading-relaxed">
              Le modèle d'apprentissage a détecté un risque {deal.risk_level} pour cette transaction en raison de retards de paiement historiques sur des profils similaires. Il est recommandé de demander une avance de trésorerie supérieure ou de vérifier les garanties de financement avant l'étape de clôture.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 flex gap-4 shadow-sm backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 backdrop-blur-md">
             <CheckCircle2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-400 mb-1">Analyse ASAS AI</h3>
            <p className="text-sm text-blue-300/80 leading-relaxed">
              La probabilité de clôture est évaluée à 85%. Le client a un profil fiable. Prochaine étape recommandée : Planifier une visite finale et préparer les documents de l'acte de vente.
            </p>
          </div>
        </motion.div>
      )}

      {/* Process & Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-[#050505] rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-2xl">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" /> Calendrier de la Transaction
          </h3>
          <div className="relative pl-6 border-l-2 border-[#171717] space-y-6">
            <div className="relative">
              <div className="absolute w-3 h-3 bg-gray-600 rounded-full -left-[29px] top-1.5" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Création de la transaction</p>
              <p className="text-xs text-gray-500">{new Date(deal.created_at).toLocaleDateString()}</p>
            </div>
             <div className="relative">
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[29px] top-1.5 ring-4 ring-[#0A0A0A]" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Négociation en cours</p>
              <p className="text-xs text-blue-400 font-medium">Actuel</p>
            </div>
             <div className="relative opacity-40">
              <div className="absolute w-3 h-3 bg-[#262626] rounded-full -left-[29px] top-1.5" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Signature finale (Prévue)</p>
              <p className="text-xs text-gray-500">Dans 14 jours</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-[#050505] rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-2xl flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-500" /> Commission Agent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Basé sur le plan de commissionement <strong className="text-gray-900 dark:text-white">Standard (3%)</strong>, l'agent assigné percevra la commission lors de la réception totale des fonds.
            </p>
           </div>
           
           <div className="mt-6 p-4 bg-white dark:bg-[#0A0A0A] rounded-xl border border-black/5 dark:border-white/5">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm text-gray-500 font-medium">Estimation Commission</span>
               <span className="text-lg font-bold text-gray-900 dark:text-white">{((agreedPrice * 0.03) / 1000).toFixed(1)}k DZD</span>
             </div>
             <div className="w-full h-1.5 bg-gray-200 dark:bg-[#171717] rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full w-1/4 opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
             </div>
             <p className="text-xs text-center text-gray-500 mt-2">Dépends du paiement final du client</p>
           </div>
        </div>
      </div>

      {isTaskModalOpen && (
        <CreateTaskModal
          dealId={dealId}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={() => setIsTaskModalOpen(false)}
        />
      )}
    </div>
  )
}
