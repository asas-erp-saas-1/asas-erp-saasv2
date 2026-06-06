// src/app/dashboard/tasks/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckSquare, Clock, AlertTriangle, Check, Zap, ListTodo, AlertOctagon, ArrowUp, ArrowRight, ArrowDown, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { CreateTaskModal } from './CreateTaskModal'

interface Task {
  id:          string
  title:       string
  description: string | null
  priority:    'low' | 'medium' | 'high' | 'urgent'
  status:      'pending' | 'in_progress' | 'done' | 'cancelled'
  due_date:    string | null
  is_automated: boolean
  deal_id:     string | null
  lead_id:     string | null
  done_at:     string | null
  created_at:  string
}

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'border-l-4 border-red-500',
  high:   'border-l-4 border-orange-500',
  medium: 'border-l-4 border-asas-gold',
  low:    'border-l-4 border-asas-silver',
}

const PRIORITY_CONFIG: Record<string, { icon: any, color: string, bg: string, border: string, label: string }> = {
  urgent: { icon: AlertOctagon, color: 'text-red-500',       bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'Urgente' },
  high:   { icon: ArrowUp,      color: 'text-orange-500',    bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Haute' },
  medium: { icon: ArrowRight,   color: 'text-asas-gold',      bg: 'bg-asas-gold/10',   border: 'border-asas-gold/20',   label: 'Moyenne' },
  low:    { icon: ArrowDown,    color: 'text-asas-silver',      bg: 'bg-asas-silver/10',       border: 'border-asas-silver/20',      label: 'Basse' },
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDue(dueDate: string | null): string {
  if (!dueDate) return 'Aucune date limite'
  const d    = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff  = Math.floor((d.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0)  return `Retard de ${Math.abs(diff)} j`
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  return `T+${diff}`
}

export default function TasksPage() {
  const [tasks,   setTasks]  = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter] = useState<'all' | 'urgent' | 'today' | 'automated'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/tasks?status=pending&status=in_progress&limit=100')
      if (!res.ok) throw new Error('Failed to load tasks')
      const data = await res.json()
      setTasks(data.data ?? data ?? [])
    } catch (e: any) {
      import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(e, { context: 'Tasks load' }))
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function markDone(id: string) {
    const backup = [...tasks];
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'done' as const, done_at: new Date().toISOString() } : t))
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) })
      if (!res.ok) throw new Error('Failed to mark task done');
    } catch (e: any) {
      import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(e, { context: 'Tasks markDone' }))
      setTasks(backup); // Revert optimistic UI
    }
  }

  const today   = new Date().toISOString().split('T')[0]!
  const filtered = tasks.filter(t => {
    if (t.status === 'done' || t.status === 'cancelled') return false
    if (filter === 'urgent')    return t.priority === 'urgent'
    if (filter === 'today')     return t.due_date === today || isOverdue(t.due_date)
    if (filter === 'automated') return t.is_automated
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const p = { urgent: 0, high: 1, medium: 2, low: 3 }
    return (p[a.priority] ?? 3) - (p[b.priority] ?? 3)
  })

  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length

  return (
    <div className="flex-1 font-sans text-white flex flex-col pt-4">
      <div className="w-full space-y-8 max-w-4xl mx-auto">
        
        {isModalOpen && (
          <CreateTaskModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={load} 
          />
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
           <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3 font-display uppercase">
                 <div className="w-12 h-12 rounded-xl bg-asas-gold/10 border border-asas-gold/20 flex items-center justify-center shadow-[0_0_15px_rgba(212,166,79,0.15)]">
                    <CheckSquare className="h-6 w-6 text-asas-gold" /> 
                 </div>
                 Tâches & Activités
              </h1>
              <p className="text-[9px] uppercase font-bold tracking-widest text-[#D4A64F] mt-2 flex items-center gap-2">
			  <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-asas-gold opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-asas-gold"></span>
              </span>
				{tasks.filter(t => t.status === 'pending').length} en file d'attente · <span className="text-red-400">{overdueCount} critiques</span>
			  </p>
           </div>
           <div className="flex items-center gap-3">
             {urgentCount > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] uppercase tracking-widest font-bold">
                   <AlertTriangle className="h-3 w-3" /> {urgentCount} Urgentes
                </div>
             )}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-asas-gold hover:bg-[#E0B96B] text-[#06152D] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(212,166,79,0.3)] transform hover:scale-[1.02] active:scale-95 outline-none"
              >
                <Plus className="w-4 h-4" strokeWidth={2} /> Nouvelle Tâche
              </button>
           </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',       label: 'Toutes' },
            { key: 'today',     label: "Aujourd'hui / En retard" },
            { key: 'urgent',    label: '🚨 Urgentes' },
            { key: 'automated', label: '⚡ Automatisées' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={clsx(
                'px-5 py-2.5 rounded-lg text-[9px] uppercase font-bold tracking-widest transition-all focus:outline-none border',
                filter === f.key ? 'bg-asas-gold/20 text-asas-gold border-asas-gold/40 shadow-[0_0_15px_rgba(212,166,79,0.2)]' : 'bg-white/5 text-white/40 hover:text-white hover:border-white/20 border-white/10'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-4 pb-8">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
            ))
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/50 bg-[#051121] rounded-2xl border border-white/10 shadow-2xl">
               <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <ListTodo className="h-8 w-8 text-white/30" />
               </div>
              <p className="text-lg font-bold text-white mb-2 font-display uppercase tracking-widest">Protocoles achevés</p>
              <p className="text-[9px] uppercase tracking-widest mt-1 font-bold">Aucune opération en attente {filter !== 'all' ? `pour le filtre '${filter}'` : ''}.</p>
            </div>
          ) : (
             <AnimatePresence>
            {sorted.map((task, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                key={task.id} 
                className={clsx('bg-[#051121] rounded-2xl p-6 flex items-start gap-5 shadow-sm border-y border-r border-white/10 group hover:border-asas-gold/40 hover:shadow-[0_0_20px_rgba(212,166,79,0.1)] transition-all', PRIORITY_STYLE[task.priority])}
              >
                {/* Checkbox */}
                <button
                  onClick={() => markDone(task.id)}
                  className="mt-0.5 h-6 w-6 rounded-lg border border-white/20 bg-black/40 flex items-center justify-center shrink-0 hover:border-asas-gold focus:outline-none focus:border-asas-gold transition-colors cursor-pointer group/checkbox"
                >
                  {task.status === 'done' && <Check className="h-4 w-4 text-asas-gold shadow-sm" />}
				  {task.status !== 'done' && <Check className="h-4 w-4 text-asas-gold opacity-0 group-hover/checkbox:opacity-50 transition-opacity" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                           <p className="text-[15px] font-bold text-white group-hover:text-asas-gold transition-colors tracking-wide leading-tight">{task.title}</p>
                           {(() => {
                             const pConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
                             if (!pConf) return null;
                             const Icon = pConf.icon
                             return (
                               <span className={clsx('text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md font-bold shrink-0 border flex items-center gap-1.5', pConf.bg, pConf.border, pConf.color)}>
                                 <Icon className="w-3 h-3" />
                                 {pConf.label}
                               </span>
                             )
                           })()}
                           {task.is_automated && (
                              <span className="text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-white/60 font-bold flex items-center gap-1 shrink-0">
                                 <Zap className="h-3 w-3 text-asas-gold" /> Auto
                              </span>
                           )}
                        </div>
                        {task.description && (
                           <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 leading-relaxed max-w-2xl">{task.description}</p>
                        )}
                     </div>

                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                     <p className={clsx('text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5', isOverdue(task.due_date) ? 'text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md w-fit' : 'text-white/30')}>
                        <Clock className="h-3 w-3" />
                        {formatDue(task.due_date)}
                     </p>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
