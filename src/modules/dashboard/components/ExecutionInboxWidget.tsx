'use client'

import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertCircle, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InboxTask {
  id: number;
  taskType: string;
  title: string;
  description: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export function ExecutionInboxWidget() {
  const [tasks, setTasks] = useState<InboxTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInbox() {
      try {
        const res = await fetch('/api/inbox');
        const json = await res.json();
        if (json.success && json.data) {
          setTasks(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch execution inbox", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInbox();
  }, []);

  const handleTaskAction = async (task: any) => {
    if (task.taskType === 'approval_request' && task.meta?.requestId) {
      if (confirm('Voulez-vous approuver cette requête ?')) {
        try {
          await fetch('/api/command-gateway', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                commandId: crypto.randomUUID(),
                aggregateId: task.meta.entityId,
                type: 'RESOLVE_APPROVAL_REQUEST',
                expectedVersion: 1,
                payload: { requestId: task.meta.requestId, status: 'approved' }
             })
          });
          setTasks(tasks.filter(t => t.id !== task.id));
        } catch(e) { console.error(e) }
      }
    } else {
      alert(`Action non implémentée pour: ${task.taskType}`)
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-[#0A1829] border border-white/5 flex flex-col h-full overflow-hidden relative group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[#D4A64F]" /> Boîte d'Exécution (Inbox)
        </h3>
        <span className="text-[10px] text-[#D4A64F] uppercase tracking-widest font-bold cursor-pointer hover:underline">Voir les {tasks.length} tâches</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-white/40 text-xs">Chargement...</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 opacity-70">
            <CheckSquare className="w-8 h-8 mb-2 opacity-30 text-[#D4A64F]" />
            <p className="text-xs">Aucune action requise.</p>
            <p className="text-[10px]">Vous êtes à jour.</p>
          </div>
        ) : (
          tasks.map((task: any) => (
            <div key={task.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition flex flex-col gap-2 cursor-pointer relative overflow-hidden group/task">
              {/* Importance strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.taskType === 'approval_request' ? 'bg-red-500' : 'bg-[#D4A64F]'}`} />
              
              <div className="flex justify-between items-start pl-2">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-white">{task.title}</h4>
                  <p className="text-[10px] text-white/50 line-clamp-1">{task.description}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleTaskAction(task); }} className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-3 h-3 text-white/50 hover:text-green-400 transition-colors" />
                </button>
              </div>

              <div className="flex justify-between items-center pl-2 pt-2 border-t border-white/10 mt-1">
                <span className="px-2 py-0.5 text-[9px] rounded bg-white/5 text-white/60 font-bold uppercase tracking-wider">
                  {task.taskType.replace('_', ' ')}
                </span>
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
                    <Clock className="w-3 h-3" />
                    <span>Echéance: {format(new Date(task.dueDate), 'dd MMM, HH:mm', { locale: fr })}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
