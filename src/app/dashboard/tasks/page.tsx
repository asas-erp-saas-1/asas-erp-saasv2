// src/app/dashboard/tasks/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Clock, AlertTriangle, Check, Zap, ListTodo } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'

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
  urgent: 'border-l-[6px] border-red-500',
  high:   'border-l-[6px] border-orange-500',
  medium: 'border-l-[6px] border-blue-500',
  low:    'border-l-[6px] border-gray-600',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low:    'bg-white/5 text-gray-400 border-white/10',
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

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/tasks?status=pending&status=in_progress&limit=100')
        if (!res.ok) throw new Error('Failed to load tasks');
        const data = await res.json()
        setTasks(data.data ?? data ?? [])
      } catch (e: any) {
        import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(e, { context: 'Tasks load' }))
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
    <div className="flex-1 font-sans text-gray-100 flex flex-col">
      <div className="w-full space-y-8 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
           <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-white" /> 
                 </div>
                 Opérations
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-2">{tasks.filter(t => t.status === 'pending').length} en file d'attente · <span className="text-red-500">{overdueCount} critiques</span></p>
           </div>
           {urgentCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                 <AlertTriangle className="h-4 w-4" /> {urgentCount} Urgentes
              </div>
           )}
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
                'px-5 py-2.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all focus:outline-none focus:ring-1',
                filter === f.key ? 'bg-white text-black focus:ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#050505] text-gray-400 hover:bg-[#0A0A0A] hover:text-white border border-white/5 focus:ring-white/20'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-[#0A0A0A] rounded-2xl border border-white/5 animate-pulse" />
            ))
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-[#0A0A0A] rounded-3xl border border-white/5 border-dashed shadow-sm">
               <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                  <ListTodo className="h-8 w-8 text-gray-400" />
               </div>
              <p className="text-lg font-bold text-white mb-2">Protocoles achevés</p>
              <p className="text-xs uppercase tracking-widest mt-1 font-bold">Aucune opération en attente {filter !== 'all' ? `pour le filtre '${filter}'` : ''}.</p>
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
                className={clsx('bg-[#050505] rounded-2xl p-5 flex items-start gap-5 shadow-lg border-y border-r border-white/5 group hover:border-white/10 transition-all', PRIORITY_STYLE[task.priority])}
              >
                {/* Checkbox */}
                <button
                  onClick={() => markDone(task.id)}
                  className="mt-0.5 h-6 w-6 rounded border-2 border-white/10 bg-[#0A0A0A] flex items-center justify-center shrink-0 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                >
                  {task.status === 'done' && <Check className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                           <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors tracking-wide">{task.title}</p>
                           <span className={clsx('text-[8px] uppercase tracking-widest px-2 py-0.5 rounded font-bold shrink-0 border border-transparent', PRIORITY_BADGE[task.priority])}>
                              {task.priority}
                           </span>
                           {task.is_automated && (
                              <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 font-bold flex items-center gap-1 shrink-0">
                                 <Zap className="h-3 w-3" /> Auto
                              </span>
                           )}
                        </div>
                        {task.description && (
                           <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 leading-relaxed max-w-2xl">{task.description}</p>
                        )}
                     </div>

                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                     <p className={clsx('text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5', isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-500')}>
                        <Clock className="h-3.5 w-3.5" />
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
