'use client'

import { useState } from 'react'
import { HardHat, CheckCircle2, Circle } from 'lucide-react'
import { clsx } from 'clsx'

export function ConstructionEngine({ projectId, projectCity, project }: { projectId: string, projectCity: string, project: any }) {
  const [tasks, setTasks] = useState(project.tasks || [])
  const phases = project.phases || []
  
  const [newTaskPhase, setNewTaskPhase] = useState<string>('')
  const [newTaskName, setNewTaskName] = useState<string>('')

  const toggleTaskStatus = async (task: any) => {
     try {
       const newStatus = task.status === 'done' ? 'todo' : 'done'
       const res = await fetch('/api/command-gateway', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            commandId: crypto.randomUUID(),
            aggregateId: task.id,
            type: 'UPDATE_PROJECT_TASK_STATUS',
            expectedVersion: 1,
            payload: { taskId: task.id, status: newStatus }
         })
       });
       if (res.ok) {
          setTasks(tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t))
       }
     } catch(e) {
       console.error(e)
     }
  }

  const handleAddTask = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newTaskPhase || !newTaskName) return;
     try {
       const res = await fetch('/api/command-gateway', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            commandId: crypto.randomUUID(),
            aggregateId: projectId,
            type: 'ADD_PROJECT_TASK',
            expectedVersion: 1,
            payload: { projectId: Number(projectId), phaseId: Number(newTaskPhase), name: newTaskName }
         })
       });
       if (res.ok) {
         const data = await res.json();
         setTasks([...tasks, data.data[0]]);
         setNewTaskName('');
       }
     } catch (e) { console.error(e) }
  }

  return (
    <div className="w-full bg-[#051121] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-white mt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
             <HardHat className="w-6 h-6 text-asas-gold" /> Suivi de Chantier & Sous-traitants
          </h2>
          <p className="text-sm text-white/50 mt-1 max-w-2xl">
             Pilotez les tâches des sous-traitants par phase.
          </p>
        </div>
        
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2">
           <select required value={newTaskPhase} onChange={e => setNewTaskPhase(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-asas-gold">
             <option value="">-- Phase --</option>
             {phases.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
           <input required type="text" placeholder="Nouvelle tâche..." value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-asas-gold min-w-[200px]" />
           <button type="submit" className="bg-asas-gold text-[#06152D] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#E0B96B] transition-colors">Ajouter</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map((phase: any) => {
           const phaseTasks = tasks.filter((t: any) => t.phaseId === phase.id)
           const phaseDone = phase.status === 'completed'
           
           return (
             <div key={phase.id} className="bg-black/20 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                   <div>
                     <h3 className={clsx("text-lg font-bold flex items-center gap-2", phaseDone ? "text-green-400" : "text-white")}>
                       {phaseDone && <CheckCircle2 className="w-5 h-5" />} {phase.name}
                     </h3>
                   </div>
                   <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{phaseTasks.length} Tâches</span>
                </div>
                
                {phaseTasks.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Aucune tâche assignée à cette phase.</p>
                ) : (
                  <div className="space-y-3">
                     {phaseTasks.map((task: any) => (
                       <div key={task.id} className={clsx("flex items-center justify-between p-3 rounded-xl border transition-colors", task.status === 'done' ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTaskStatus(task)}>
                            {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5 text-white/30" />}
                            <span className={clsx("text-sm font-medium", task.status === 'done' ? "text-green-400 line-through opacity-70" : "text-white")}>{task.name}</span>
                          </div>
                          {task.vendor && (
                            <span className="text-[9px] bg-asas-gold text-[#06152D] px-2 py-1 rounded font-bold uppercase tracking-widest">
                               {task.vendor.name}
                            </span>
                          )}
                       </div>
                     ))}
                  </div>
                )}
             </div>
           )
        })}
      </div>
    </div>
  )
}
