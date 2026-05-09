'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Wrench, CheckCircle2, MessageCircle, FileText, Plus, Loader2 } from 'lucide-react'
import type { Deal, Task } from '@/types/app'
import { ErrorTracker } from '@/lib/observability/errors'
import { jsPDF } from 'jspdf'

export function SAVPanelModal({ deal, onClose, onUpdate }: { deal: Deal, onClose: () => void, onUpdate: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?deal_id=${deal.id}`)
      if (res.ok) {
        const data = await res.json()
        // Filter tasks that are SAV related. Let's just show all tasks for a closed deal here 
        // as they are typically SAV tasks.
        setTasks(data.data || [])
      }
    } catch (err) {
      ErrorTracker.captureError(err, { context: 'Load SAV tasks' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setIsAdding(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[SAV] ${newTaskTitle}`,
          deal_id: deal.id,
          priority: 'high',
          status: 'pending'
        })
      })
      setNewTaskTitle('')
      loadTasks()
    } finally {
      setIsAdding(false)
    }
  }

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus })
      })
    } catch (error) {
       loadTasks() // Revert
    }
  }

  const generatePV = () => {
    const doc = new jsPDF()
    const clientName = deal.clients?.full_name || 'Client Inconnu'
    const propertyRef = deal.properties?.reference_code || 'N/A'
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("PROCES-VERBAL DE REMISE DES CLES", 105, 20, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 20, 40)
    doc.text(`Acquéreur : ${clientName}`, 20, 50)
    doc.text(`Référence Lot : ${propertyRef}`, 20, 60)

    doc.setFont("helvetica", "bold")
    doc.text("RESERVES SOUMISES PAR L'ACQUEREUR :", 20, 80)
    
    doc.setFont("helvetica", "normal")
    let y = 90
    const savTasks = tasks.filter(t => t.title.includes('[SAV]'))
    
    if (savTasks.length === 0) {
       doc.text("Aucune réserve signalée. Réception sans réserve.", 25, y)
    } else {
       savTasks.forEach((t, i) => {
          doc.text(`${i + 1}. ${t.title.replace('[SAV] ', '')} - Statut: ${t.status === 'done' ? 'Levée' : 'En attente'}`, 25, y)
          y += 10
       })
    }

    y += 30
    doc.setFont("helvetica", "bold")
    doc.text("Signatures :", 20, y)
    doc.text("Le Promoteur", 40, y + 15)
    doc.text("L'Acquéreur", 130, y + 15)

    doc.save(`PV_Livraison_${propertyRef}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0A0A0A] rounded-[2rem] shadow-2xl border border-black/10 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-[#050505] shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md mb-2 inline-block">
              Gestion SAV
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              Lot {deal.properties?.reference_code}
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Acquéreur: {deal.clients?.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
           
           {/* Actions */}
           <div className="flex items-center gap-3">
             <button onClick={generatePV} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl font-bold text-sm transition-colors active:scale-95">
                <FileText className="w-4 h-4" /> Générer PV de Livraison (PDF)
             </button>
             <button onClick={() => window.open(`https://wa.me/${deal.clients?.phone?.replace(/\+/g, '')}`, '_blank')} className="flex items-center justify-center px-4 py-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl font-bold text-sm transition-colors active:scale-95" title="Contacter sur WhatsApp">
                <MessageCircle className="w-4 h-4" /> WhatsApp
             </button>
           </div>

           {/* Réserves / Snags List */}
           <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                 <Wrench className="w-4 h-4 text-indigo-500" /> Réserves & Interventions
              </h3>

              <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
                <input 
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Peinture écaillée au salon..."
                  className="flex-1 bg-gray-50 dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button disabled={!newTaskTitle.trim() || isAdding} type="submit" className="w-12 shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors">
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
              </form>

              {loading ? (
                <div className="py-10 text-center flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : tasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-gray-300 dark:border-[#262626] rounded-2xl">
                  <p className="text-sm font-medium text-gray-500">Aucune réserve n'a été signalée pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${task.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white dark:bg-[#0A0A0A] border-black/5 dark:border-white/5'}`}>
                       <button onClick={() => toggleTaskStatus(task)} className="mt-0.5 shrink-0">
                         {task.status === 'done' ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         ) : (
                           <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                         )}
                       </button>
                       <div className="min-w-0">
                         <p className={`text-sm font-bold truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                           {task.title.replace('[SAV] ', '')}
                         </p>
                         <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">
                           {task.status === 'done' ? 'Levée' : 'Signalée'}
                         </p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

        </div>
      </motion.div>
    </div>
  )
}
