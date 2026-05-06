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
        className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/5 bg-gray-100 dark:bg-[#111111]">
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
                <h4 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Activités & Historique
                </h4>
                
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
           <button className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform active:scale-95 flex items-center gap-2">
             <MessageCircle className="w-4 h-4" /> Message Rapide
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
