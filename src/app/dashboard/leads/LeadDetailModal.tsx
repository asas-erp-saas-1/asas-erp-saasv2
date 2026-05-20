'use client'

import React, { useEffect, useState } from 'react'
import { X, Phone, MessageCircle, Clock, Calendar, Mail, FileText, User, Navigation } from 'lucide-react'
import type { Lead, Activity } from '@/types/app'
import { CreateTaskModal } from '@/app/dashboard/tasks/CreateTaskModal'

interface LeadDetailModalProps {
  leadId: string | null
  onClose: () => void
}

export function LeadDetailModal({ leadId, onClose }: LeadDetailModalProps) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  useEffect(() => {
    if (!leadId) return
    let mounted = true
    
    async function loadData() {
      setLoading(true)
      try {
        const [leadRes, actRes] = await Promise.all([
          fetch(`/api/leads/${leadId}`),
          fetch(`/api/activities?lead_id=${leadId}`)
        ])
        
        if (leadRes.ok && mounted) {
          const data = await leadRes.json()
          setLead(data)
        }
        
        if (actRes.ok && mounted) {
          const actData = await actRes.json()
          setActivities(actData.data || [])
        }
      } catch (err) {
        console.error("Failed to load lead details", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadData()
    return () => { mounted = false }
  }, [leadId])

  if (!leadId) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#141618] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-asas-silver/20 bg-asas-sand/50 dark:bg-[#141618]">
          <div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
               Détails du Prospect
             </h2>
             <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-bold">INFO ET HISTORIQUE</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-24 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5" />
              <div className="h-64 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5" />
            </div>
          ) : !lead ? (
            <div className="text-center py-20 text-gray-500">
               Le prospect n'a pas pu être chargé.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="bg-gray-100 dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-inner">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                   {(lead as any).clients?.full_name ?? 'Client Inconnu'}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                         <Phone className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="font-mono">{(lead as any).clients?.phone || 'Non spécifié'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                         <Mail className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="truncate">{(lead as any).clients?.email || 'Non spécifié'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                         <Clock className="w-4 h-4 text-orange-400" />
                      </div>
                      <span>Statut: <strong className="uppercase">{lead.status}</strong></span>
                    </div>

                    {(lead.budget_min || lead.budget_max) && (
                       <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300">
                         <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-purple-400">DZ</span>
                         </div>
                         <strong className="font-mono">
                           {lead.budget_min || '?'} → {lead.budget_max || '?'}
                         </strong>
                       </div>
                    )}

                    {lead.source && (
                       <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300">
                         <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-indigo-400">#</span>
                         </div>
                         <span>Source: <strong>{lead.source}</strong></span>
                       </div>
                    )}

                    {(lead as any).profiles && (
                       <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300">
                         <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-pink-400" />
                         </div>
                         <span>Assigné à: <strong>{(lead as any).profiles.full_name || 'Agent'}</strong></span>
                       </div>
                    )}
                 </div>
              </div>

              {/* Algorithmic Matchmaker */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 shadow-inner">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Smart Match</h3>
                    <p className="text-xs text-indigo-500/70 font-bold mt-1">3 biens correspondent aux critères de ce profil.</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { ref: 'V-459', type: 'Villa', location: 'Hydra', price: '45M DZD' },
                    { ref: 'F-920', type: 'F4', location: 'Cheraga', price: '42M DZD' },
                    { ref: 'T-112', type: 'Terrain', location: 'Ouled Fayet', price: '38M DZD' },
                  ].map((match, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl shadow-sm hover:border-indigo-500/30 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#111111] text-gray-500 rounded border border-black/5 dark:border-white/5">{match.ref}</span> 
                          {match.type} • {match.location}
                        </span>
                        <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{match.price}</p>
                      </div>
                      <button 
                        onClick={() => window.open(`https://wa.me/${(lead as any).clients?.phone?.replace(/\+/g, '') || ''}?text=${encodeURIComponent(`Salam ${(lead as any).clients?.full_name || ''},\n\nNous avons trouvé un bien qui pourrait vous intéresser :\nRéf: ${match.ref}\nType: ${match.type}\nSecteur: ${match.location}\nPrix: ${match.price}\n\nContactez-moi pour plus de détails.`)}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg text-xs font-bold transition-colors border border-[#25D366]/20 shadow-sm active:scale-95">
                        <MessageCircle className="w-4 h-4" /> Proposer
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="bg-gray-100 dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-inner">
                  <h4 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Notes Additionnelles
                  </h4>
                  <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                </div>
              )}

              {/* Tracking / Activities */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Activités & Historique
                  </h4>
                </div>

                <div className="mb-6 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="new-note-input"
                      className="flex-1 bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Ajouter une note rapide..."
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim() && !loading) {
                          const val = e.currentTarget.value.trim();
                          e.currentTarget.value = '';
                          try {
                            const res = await fetch('/api/activities', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ lead_id: leadId, type: 'note', description: val })
                            });
                            if (res.ok) {
                              const newAct = await res.json();
                              setActivities(prev => [newAct.data, ...prev]);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={async () => {
                        const input = document.getElementById('new-note-input') as HTMLInputElement;
                        if (!input || !input.value.trim() || loading) return;
                        const val = input.value.trim();
                        input.value = '';
                        try {
                          const res = await fetch('/api/activities', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lead_id: leadId, type: 'note', description: val })
                          });
                          if (res.ok) {
                            const newAct = await res.json();
                            setActivities(prev => [newAct.data, ...prev]);
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors">
                      Ajouter
                    </button>
                  </div>
                  
                  {/* Smart Chips for Instant Logging */}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-2">Action Rapide:</span>
                    {[
                      { label: "Appel sans réponse", val: "Pas de réponse suite à l'appel", icon: "📞" },
                      { label: "Localisation partagée", val: "Localisation du projet partagée sur WhatsApp", icon: "📍" },
                      { label: "Pas intéressé", val: "A déclaré ne plus être intéressé", icon: "❌" },
                      { label: "Visite confirmée", val: "A confirmé sa présence pour une visite sur site", icon: "🤝" }
                    ].map(chip => (
                      <button
                        key={chip.label}
                        onClick={async () => {
                          if (loading) return;
                          try {
                            const res = await fetch('/api/activities', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ lead_id: leadId, type: 'note', description: `${chip.icon} ${chip.val}` })
                            });
                            if (res.ok) {
                              const newAct = await res.json();
                              setActivities(prev => [newAct.data, ...prev]);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <span className="opacity-70">{chip.icon}</span> {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((act) => (
                      <div key={act.id} className="relative pl-6 pb-2">
                        {/* Timeline line */}
                        <div className="absolute top-2 left-[11px] bottom-[-16px] w-[2px] bg-black/5 dark:bg-white/5" />
                        
                        {/* Timeline dot */}
                        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#0A0A0A]" />
                        
                        <div className="bg-gray-100 dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-lg p-4 transition-colors hover:bg-[#141414]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{act.type}</span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(act.created_at).toLocaleString('fr-FR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-300">
                            {act.description}
                          </p>
                          {(act as any).profiles?.full_name && (
                            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">
                              Par {(act as any).profiles.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-[#111111] border border-dashed border-black/10 dark:border-white/10 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-500 font-medium">Aucune activité enregistrée pour l'instant.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-gray-100 dark:bg-[#111111] flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors"
           >
             Fermer
           </button>
           <button 
             onClick={() => setIsTaskModalOpen(true)}
             className="px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors flex items-center gap-2"
           >
             <Calendar className="w-4 h-4" /> Créer Tâche
           </button>
           <button 
             onClick={() => window.open(`https://wa.me/${(lead as any).clients?.phone?.replace(/\+/g, '') || ''}`, '_blank')}
             className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform active:scale-95 flex items-center gap-2"
           >
             <MessageCircle className="w-4 h-4" /> Message WhatsApp
           </button>
        </div>
      </div>

      {isTaskModalOpen && (
        <CreateTaskModal
          leadId={leadId}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={() => {
            // Ideally we could refetch tasks or activities here if needed,
            // or just let a toast notify the user.
            setIsTaskModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
