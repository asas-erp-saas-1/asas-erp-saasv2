'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Check, Copy, Share2, Smartphone, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

export function AppInviteWidget() {
  const [copied, setCopied] = useState(false)
  const [inviteToken, setInviteToken] = useState('ag-loading')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateInvite();
  }, [])

  const generateInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invite/generate', { method: 'POST', body: JSON.stringify({ role: 'AGENT' }) });
      if (res.ok) {
        const data = await res.json();
        setInviteToken(data.token);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return "https://app.asas.dz";
  }

  const inviteLink = `${getBaseUrl()}/invite/${inviteToken}`
  const welcomeMessage = `Salam, rejoins l'agence sur ASAS ERP !\n\nLien: ${inviteLink}`

  const handleCopy = () => {
    navigator.clipboard.writeText(welcomeMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(welcomeMessage)}`, '_blank')
  }

  return (
    <div className="bg-white dark:bg-[#141618] border border-asas-silver/20 rounded-sm p-8 shadow-sm relative overflow-hidden mb-8 group hover:border-asas-gold/40 transition-colors">
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-asas-charcoal dark:text-asas-sand">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-sm bg-asas-navy/10 border border-asas-navy/20 flex items-center justify-center">
                 <Share2 className="w-4 h-4 text-asas-navy dark:text-asas-sand" />
               </div>
               <h2 className="text-sm font-bold uppercase tracking-widest font-display">Ajout Rapide Équipe (Zéro Setup)</h2>
             </div>
             <button onClick={generateInvite} disabled={loading} className="text-asas-silver hover:text-asas-gold transition-colors" title="Générer un nouveau lien">
                <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
             </button>
          </div>
          <p className="text-[10px] font-bold text-asas-silver leading-relaxed mb-6 max-w-lg">
            Copiez ce message WhatsApp et envoyez-le à vos agents. Les rôles, les pipelines et les étapes de vente sont déjà pré-configurés pour le marché immobilier nord-africain.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={handleCopy}
              disabled={loading}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-sm text-[9px] uppercase tracking-widest font-bold transition-all shadow-sm cursor-pointer",
                copied ? "bg-asas-emerald/10 text-asas-emerald border border-asas-emerald/20" : "bg-asas-charcoal dark:bg-asas-sand text-asas-sand dark:text-asas-charcoal hover:bg-asas-charcoal/90 dark:hover:bg-asas-sand/90 border border-transparent",
                loading && "opacity-50"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Lien Copié !" : "Copier le lien d'invitation"}
            </button>
            <button 
              onClick={handleWhatsApp}
              disabled={loading}
              className={clsx(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-sm text-[9px] uppercase tracking-widest font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors shadow-sm cursor-pointer",
                loading && "opacity-50"
              )}
            >
              <Smartphone className="w-4 h-4" />
              Envoyer par WhatsApp
            </button>
          </div>
        </div>

        <div className="w-full md:w-auto p-4 bg-asas-sand/30 dark:bg-black/10 border border-asas-silver/20 rounded-sm">
          <div className="bg-white dark:bg-[#141618] rounded-sm p-4 w-full md:w-72 shadow-sm border border-asas-silver/10">
            <p className="text-[9px] text-asas-silver font-bold mb-2 uppercase tracking-widest flex items-center justify-between">
              Message pré-généré
              {loading && <span className="text-[8px] text-asas-gold animate-pulse">Génération...</span>}
            </p>
            <p className="text-[10px] font-bold text-asas-charcoal dark:text-asas-sand font-mono whitespace-pre-wrap">{welcomeMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
