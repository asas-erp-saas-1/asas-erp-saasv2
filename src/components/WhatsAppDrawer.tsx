'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'
import { clsx } from 'clsx'

interface WhatsAppDrawerProps {
  isOpen: boolean
  onClose: () => void
  clientName: string
  clientPhone: string
  contextType: 'lead' | 'deal' | 'sav'
  propertyName?: string
}

export function WhatsAppDrawer({ isOpen, onClose, clientName, clientPhone, contextType, propertyName = 'notre programme' }: WhatsAppDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  
  useEffect(() => { setMounted(true) }, [])

  const templates = {
    lead: [
      { id: 1, title: 'Premier Contact', text: `Bonjour ${clientName}, je suis conseiller chez ASAS Immobilier. Je vous contacte suite à votre intérêt pour ${propertyName}. Avez-vous quelques minutes pour en discuter ?` },
      { id: 2, title: 'Confirmation de visite', text: `Bonjour ${clientName}, je vous confirme notre rendez-vous pour la visite concernant ${propertyName}. À très vite !` },
      { id: 3, title: 'Relance', text: `Bonjour ${clientName}, avez-vous pu prendre une décision concernant ${propertyName} ? Je reste à votre disposition.` }
    ],
    deal: [
      { id: 4, title: 'Appel de fonds', text: `Bonjour ${clientName}, l'étape concernant ${propertyName} est achevée. Vous trouverez le nouvel appel de fonds sur votre espace client.` },
      { id: 5, title: 'Félicitations', text: `Bonjour ${clientName}, félicitations pour votre réservation de ${propertyName} ! Toute l'équipe ASAS vous remercie.` }
    ],
    sav: [
      { id: 6, title: 'Prise en charge SAV', text: `Bonjour ${clientName}, nous avons bien noté vos réserves concernant ${propertyName}. Notre équipe technique intervient prochainement.` },
      { id: 7, title: 'SAV Résolu', text: `Bonjour ${clientName}, les interventions sur ${propertyName} sont terminées. Merci de votre patience.` }
    ]
  }

  const activeTemplates = templates[contextType] || templates.lead
  const currentMessage = selectedTemplate ? activeTemplates.find(t => t.id === selectedTemplate)?.text : ''

  if (!mounted) return null

  const handleSend = () => {
    if (!currentMessage || !clientPhone) return
    const cleanPhone = clientPhone.replace(/\+/g, '').replace(/\s+/g, '')
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentMessage)}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className={clsx(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sheet */}
      <div
        className={clsx(
          "fixed inset-x-0 sm:inset-x-auto sm:right-0 sm:top-0 bottom-0 z-[9999] sm:w-[400px] w-full bg-white dark:bg-[#0A0A0A] sm:border-l border-t sm:border-t-0 border-black/10 dark:border-white/10 flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        )}
      >
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full"></div>
        </div>

        <div className="px-6 pb-4 pt-4 sm:pt-6 flex items-center justify-between border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              Action WhatsApp
            </h2>
            <p className="text-xs text-gray-500 mt-1">Destinataire: <span className="font-bold text-gray-800 dark:text-gray-300">{clientName}</span></p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Modèles de messages ({contextType})</p>
          
          <div className="space-y-3">
            {activeTemplates.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={clsx(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedTemplate === t.id 
                    ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/50 shadow-sm"
                    : "bg-gray-50 dark:bg-[#111111] border-black/10 dark:border-white/10 hover:border-emerald-500/30"
                )}
              >
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Aperçu du message</p>
              <div className="p-4 bg-[#e5ddd5] dark:bg-[#075e54]/20 rounded-xl rounded-tr-none border border-black/5 dark:border-[#075e54]/50 shadow-sm">
                <p className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{currentMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-black/5 dark:border-white/5 bg-gray-50 dark:bg-[#050505] shrink-0">
          <button
            onClick={handleSend}
            disabled={!selectedTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" /> 
            Envoyer sur WhatsApp
          </button>
        </div>
      </div>
    </>
  )
}
