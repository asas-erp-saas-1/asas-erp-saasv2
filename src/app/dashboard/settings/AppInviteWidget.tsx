'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Copy, Share2, Smartphone } from 'lucide-react'
import { clsx } from 'clsx'

export function AppInviteWidget() {
  const [copied, setCopied] = useState(false)
  const inviteLink = "https://app.asas.dz/invite/ag-k79m2p"
  const welcomeMessage = `Salam, rejoins l'agence sur ASAS ERP !\n\nLien: ${inviteLink}\nCode: 4892`

  const handleCopy = () => {
    navigator.clipboard.writeText(welcomeMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(welcomeMessage)}`, '_blank')
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Share2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight font-display">Ajout Rapide Équipe (Zéro Setup)</h2>
          </div>
          <p className="text-sm font-medium text-blue-100/80 leading-relaxed mb-6 max-w-lg">
            Copiez ce message WhatsApp et envoyez-le à vos agents. Les rôles, les pipelines et les étapes de vente sont déjà pré-configurés pour le marché immobilier nord-africain.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={handleCopy}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95",
                copied ? "bg-emerald-500 text-white shadow-emerald-500/25" : "bg-white text-blue-900 hover:bg-gray-50 shadow-white/10"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Lien Copié !" : "Copier le lien d'invitation"}
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#25D366]/20 border border-[#25D366]/30 hover:bg-[#25D366]/30 transition-colors shadow-lg active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              Envoyer par WhatsApp
            </button>
          </div>
        </div>

        <div className="w-full md:w-auto p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <div className="bg-[#050505] rounded-xl p-4 w-full md:w-72 shadow-inner">
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-widest">Message pré-généré</p>
            <p className="text-sm font-medium text-gray-300 font-mono whitespace-pre-wrap">{welcomeMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
