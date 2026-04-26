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
  high:   'border-l-[6px] border-orange-400',
  medium: 'border-l-[6px] border-blue-400',
  low:    'border-l-[6px] border-gray-300',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
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
  if (diff < 0)  return `En retard de ${Math.abs(diff)} jour${Math.abs(diff) !== 1 ? 's' : ''}`
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  return `Dans ${diff} jours`
}

export default function TasksPage() {
  const [tasks,   setTasks]  = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter] = useState<'all' | 'urgent' | 'today' | 'automated'>('all')

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/tasks?status=pending&status=in_progress&limit=100')
        const data = await res.json()
        setTasks(data.data ?? data ?? [])
      } catch {
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function markDone(id: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'done' as const, done_at: new Date().toISOString() } : t))
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) })
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
           <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CheckSquare className="h-5 w-5 text-blue-600" /> 
                 </div>
                 Tâches
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-2">{tasks.filter(t => t.status === 'pending').length} en attente · <span className="text-red-500">{overdueCount} en retard</span></p>
           </div>
           {urgentCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold shadow-sm">
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
                'px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none focus:ring-4',
                filter === f.key ? 'bg-[#1A2A4A] text-white focus:ring-[#1A2A4A]/20' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 focus:ring-gray-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm blur-[0.2px]">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ListTodo className="h-10 w-10 text-gray-300" />
               </div>
              <p className="text-lg font-bold text-gray-900">Tout est à jour !</p>
              <p className="text-sm mt-1 font-medium">Aucune tâche en attente {filter !== 'all' ? `pour le filtre '${filter}'` : ''}.</p>
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
                className={clsx('bg-white rounded-2xl p-5 flex items-start gap-5 shadow-sm hover:shadow-md transition-shadow border-y border-r border-gray-100 group', PRIORITY_STYLE[task.priority])}
              >
                {/* Checkbox */}
                <button
                  onClick={() => markDone(task.id)}
                  className="mt-0.5 h-6 w-6 rounded border-2 border-gray-300 flex items-center justify-center shrink-0 hover:border-emerald-500 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {task.status === 'done' && <Check className="h-4 w-4 text-emerald-600" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                           <p className="text-base font-bold text-gray-900 group-hover:text-blue-900 transition-colors uppercase">{task.title}</p>
                           <span className={clsx('text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-lg font-bold shrink-0 border border-transparent', PRIORITY_BADGE[task.priority])}>
                              {task.priority}
                           </span>
                           {task.is_automated && (
                              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 font-bold flex items-center gap-1 shrink-0">
                                 <Zap className="h-3 w-3" /> Auto
                              </span>
                           )}
                        </div>
                        {task.description && (
                           <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">{task.description}</p>
                        )}
                     </div>

                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                     <p className={clsx('text-xs font-bold flex items-center gap-1.5', isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-400')}>
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
