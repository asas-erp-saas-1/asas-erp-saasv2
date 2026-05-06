'use client'

import React, { useState } from 'react'
import { X, Calendar, Flag, User, Loader2 } from 'lucide-react'
import { createTaskAction } from '@/actions/taskActions'

interface CreateTaskModalProps {
  leadId?: string | null
  dealId?: string | null
  onClose: () => void
  onSuccess?: () => void
}

export function CreateTaskModal({ leadId, dealId, onClose, onSuccess }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: '' // Optionally allow assigning to specific agent if we had the list
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const result = await createTaskAction({
        title: formData.title,
        description: formData.description,
        priority: formData.priority as any,
        due_date: formData.due_date || null,
        lead_id: leadId || null,
        deal_id: dealId || null,
        // Since we don't have assigned_to from a dropdown here easily, we rely on createTaskAction to assign it to the current user or handle it.
      })
      
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess?.()
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#111111]">
          <h2 className="text-xl font-bold text-white">Nouvelle Tâche</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Titre *</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono text-sm"
              placeholder="Ex: Appeler pour relance..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono text-sm resize-none"
              placeholder="Détails de la tâche..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4" /> Priorité
              </label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all font-mono text-sm appearance-none"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Échéance
              </label>
              <input 
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all font-mono text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Création...' : 'Créer Tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
