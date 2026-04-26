// src/modules/deals/components/DealIntelligencePanel.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, AlertTriangle, User, Building, MapPin, Calculator, Calendar, ArrowUpRight, DollarSign, FileText } from 'lucide-react'
import { clsx } from 'clsx'

export function DealIntelligencePanel({ dealId }: { dealId: string }) {
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/deals?id=${dealId}`)
      .then(r => r.json())
      .then(d => {
        setDeal(d.data?.[0])
        setLoading(false)
      })
  }, [dealId])

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col justify-center items-center text-gray-400">
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

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 flex items-center justify-between px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none mb-1">
                Transaction #{dealId.substring(0,8).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Dernière modification le {new Date(deal.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            Générer Contrat
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" /> Montant total convenu
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {(deal.agreed_price / 1_000_000).toFixed(1)} <span className="text-lg text-gray-500 font-medium">M DZD</span>
            </p>
            <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={clsx("h-full rounded-full transition-all duration-1000", deal.total_payments_received >= deal.agreed_price ? 'bg-emerald-500' : 'bg-[#1A2A4A]')} 
                style={{ width: `${Math.min((deal.total_payments_received / deal.agreed_price) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {(deal.total_payments_received / 1_000_000).toFixed(1)}M payé • {((deal.agreed_price - deal.total_payments_received) / 1_000_000).toFixed(1)}M restant
            </p>
          </div>
          
          <div className="p-6">
             <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Informations Client
            </p>
            <p className="text-base font-semibold text-gray-900 mb-1">{deal.clients?.full_name}</p>
            <p className="text-sm text-gray-600 mb-1">{deal.clients?.phone}</p>
            <a href="#" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 font-medium mt-1">
              Voir profil client <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="p-6">
             <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" /> Propriété & Projet
            </p>
            <p className="text-base font-semibold text-gray-900 mb-1">{deal.properties?.projects?.name || 'Projet inconnu'}</p>
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400" /> {deal.properties?.reference || 'Réf: ---'}
            </p>
            <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
              Type: {deal.properties?.property_type || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights & Risk */}
      {isCritical ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 p-5 rounded-2xl border border-red-200 flex gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
             <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="relative z-10">
            <h3 className="text-base font-bold text-red-900 mb-1">Alerte de Risque Intelligence Artificielle</h3>
            <p className="text-sm text-red-800 leading-relaxed">
              Le modèle d'apprentissage a détecté un risque {deal.risk_level} pour cette transaction en raison de retards de paiement historiques sur des profils similaires. Il est recommandé de demander une avance de trésorerie supérieure ou de vérifier les garanties de financement avant l'étape de clôture.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
             <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-900 mb-1">Analyse ASAS AI</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              La probabilité de clôture est évaluée à 85%. Le client a un profil fiable. Prochaine étape recommandée : Planifier une visite finale et préparer les documents de l'acte de vente.
            </p>
          </div>
        </motion.div>
      )}

      {/* Process & Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" /> Calendrier de la Transaction
          </h3>
          <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
            <div className="relative">
              <div className="absolute w-3 h-3 bg-[#1A2A4A] rounded-full -left-[29px] top-1.5" />
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Création de la transaction</p>
              <p className="text-xs text-gray-500">{new Date(deal.created_at).toLocaleDateString()}</p>
            </div>
             <div className="relative">
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[29px] top-1.5 ring-4 ring-blue-50" />
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Négociation en cours</p>
              <p className="text-xs text-blue-600 font-medium">Actuel</p>
            </div>
             <div className="relative opacity-40">
              <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[29px] top-1.5" />
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Signature finale (Prévue)</p>
              <p className="text-xs text-gray-500">Dans 14 jours</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-400" /> Commission Agent
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Basé sur le plan de commissionement <strong>Standard (3%)</strong>, l'agent assigné percevra la commission lors de la réception totale des fonds.
            </p>
           </div>
           
           <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm text-gray-500 font-medium">Estimation Commission</span>
               <span className="text-lg font-bold text-gray-900">{((deal.agreed_price * 0.03) / 1000).toFixed(1)}k DZD</span>
             </div>
             <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 rounded-full w-1/4 opacity-50" />
             </div>
             <p className="text-xs text-center text-gray-400 mt-2">Dépends du paiement final du client</p>
           </div>
        </div>
      </div>
    </div>
  )
}
