// src/app/dashboard/calendar/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { CreateTaskModal } from '../tasks/CreateTaskModal'

interface Task {
  id:          string
  title:       string
  description: string | null
  priority:    'low' | 'medium' | 'high' | 'urgent'
  status:      'pending' | 'in_progress' | 'done' | 'cancelled'
  due_date:    string | null
  is_automated: boolean
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Standard Calendar State
  const [currentDate, setCurrentDate] = useState(new Date())

  const load = async () => {
    setLoading(true)
    try {
      // Fetch upcoming and past tasks
      const res = await fetch('/api/tasks?limit=250')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() // 0 is Sunday
  
  // Format to standard week (Monday first)
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  
  const daysArray = useMemo(() => {
    const arr = []
    for (let i = 0; i < offset; i++) {
      arr.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }
    // Pad remaining
    while (arr.length % 7 !== 0) {
      arr.push(null)
    }
    return arr
  }, [currentDate, daysInMonth, offset])

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex-1 font-sans text-gray-900 dark:text-gray-100 flex flex-col h-full overflow-hidden p-6 max-w-7xl mx-auto w-full">
      {isModalOpen && (
        <CreateTaskModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={load} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-asas-silver/20 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-asas-charcoal dark:text-asas-sand tracking-tight flex items-center gap-3 font-display uppercase">
            <div className="w-12 h-12 rounded-sm bg-asas-sand/50 dark:bg-black/10 border border-asas-silver/20 flex items-center justify-center shadow-sm">
              <CalendarIcon className="h-6 w-6 text-asas-gold" /> 
            </div>
            Agenda Opérationnel
          </h1>
          <p className="text-[9px] uppercase font-bold tracking-widest text-asas-silver mt-2">Projection des missions & visites programmées</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[#141618] rounded-sm p-1 border border-asas-silver/20 shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-asas-sand/50 dark:hover:bg-black/10 rounded-sm transition-colors text-asas-charcoal dark:text-asas-sand">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 font-bold text-xs tracking-widest uppercase w-36 text-center text-asas-charcoal dark:text-asas-sand">{monthName}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-asas-sand/50 dark:hover:bg-black/10 rounded-sm transition-colors text-asas-charcoal dark:text-asas-sand">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-asas-charcoal dark:bg-asas-sand text-asas-sand dark:text-asas-charcoal hover:bg-black dark:hover:bg-white font-bold text-xs rounded-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all outline-none"
          >
            Nouvelle Opération
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 flex flex-col mt-6 border border-asas-silver/20 rounded-sm overflow-hidden shadow-sm bg-white dark:bg-[#141618]">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-asas-silver/20 bg-asas-sand/50 dark:bg-black/10">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="px-2 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-asas-silver">
              {d}
            </div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {daysArray.map((date, i) => {
            if (!date) return <div key={i} className="border-b border-r border-asas-silver/10 bg-asas-silver/5 p-2 min-h-[100px]" />
            
            const dateStr = date.toISOString().slice(0, 10)
            const isToday = dateStr === todayStr
            const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr))
            
            return (
              <div key={i} className={clsx("border-b border-r border-asas-silver/10 p-2 flex flex-col min-h-[120px] transition-colors hover:bg-asas-sand/30 dark:hover:bg-black/10", isToday && "bg-asas-gold/5 dark:bg-asas-gold/5")}>
                <div className="flex items-center justify-between mb-2">
                  <span className={clsx("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-sm", isToday ? "bg-asas-charcoal dark:bg-asas-sand text-asas-sand dark:text-asas-charcoal shadow-sm" : "text-asas-charcoal dark:text-asas-sand font-mono")}>
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && <span className="text-[9px] font-bold text-asas-charcoal dark:text-asas-sand bg-asas-silver/20 px-1.5 py-0.5 rounded-sm">{dayTasks.length}</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {loading ? (
                    <div />
                  ) : dayTasks.map(task => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={clsx(
                        "text-[9px] font-bold p-1.5 rounded-sm truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
                        task.status === 'done' ? "bg-asas-emerald/10 text-asas-emerald border border-asas-emerald/20 line-through" :
                        task.priority === 'urgent' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                        task.priority === 'high' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                        "bg-asas-navy/10 text-asas-navy dark:text-asas-sand border border-asas-navy/20"
                      )}
                      title={task.title}
                    >
                      {task.status === 'done' ? <CheckSquare className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{task.title}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
