'use client'

import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, Check, X, Clock, Workflow, 
  ArrowRight, ShieldAlert, FileText, Loader2, RefreshCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

export function WorkflowEngineModule() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inbox');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTasks(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleApproval = async (taskId: string, reqId: string, action: 'approve'|'reject') => {
    setProcessingId(taskId);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: reqId, action })
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500 bg-transparent text-white pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5 relative z-10 w-full px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 mb-2 hidden sm:flex">
            <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] text-[#06b6d4] uppercase font-bold tracking-widest flex items-center gap-1">
               <GitPullRequest className="w-3 h-3" />
               <span>Execution Inbox Active</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display">
            Execution Inbox
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#06b6d4] mt-2 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-[ping_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
            Global Workflow Orchestration • Tasks & Approvals
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={fetchInbox} className="flex items-center justify-center p-2.5 bg-[#0A1829] border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              <RefreshCcw className={clsx("w-4 h-4 text-white/50", loading && "animate-spin")} />
           </button>
           <button className="flex items-center gap-2 px-6 py-2.5 shrink-0 bg-[#06b6d4] hover:bg-cyan-400 text-[#051121] rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 border border-transparent outline-none">
             <Workflow className="w-4 h-4" /> Builder
           </button>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col px-4 sm:px-6 pb-6">
         {loading && tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
               <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
               <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Synchronizing Workflows...</p>
            </div>
         ) : tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.05),_transparent_50%)]"></div>
               <div className="text-center relative z-10 flex flex-col items-center">
                 <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                   <ShieldAlert className="w-10 h-10 text-cyan-400" />
                 </div>
                 <h2 className="text-xl font-bold font-display text-white mb-2 tracking-tight">Inbox All Clear</h2>
                 <p className="text-xs font-medium text-white/50 leading-relaxed max-w-sm">
                   You have no pending tasks or approvals in your system queue.
                 </p>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-4 w-full max-w-5xl mx-auto">
               <AnimatePresence>
                 {tasks.map((task, i) => {
                    const isApproval = task.taskType === 'approval_request';
                    return (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: i * 0.05 }}
                        className={clsx(
                           "flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all",
                           task.priority 
                             ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
                             : "bg-[#0A1829] border-white/5 hover:border-white/10 hover:bg-[#0C1E36]"
                        )}
                      >
                         <div className="flex gap-4 items-start md:items-center">
                            <div className={clsx(
                               "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner",
                               task.priority ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            )}>
                               {isApproval ? <ShieldAlert className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2 mb-1">
                                  {task.priority && (
                                     <span className="text-[8px] uppercase tracking-widest font-bold bg-red-400 text-black px-1.5 py-0.5 rounded-sm">High Priority</span>
                                  )}
                                  <span className="text-[9px] uppercase tracking-widest font-bold text-white/40">{task.taskType.replace('_', ' ')}</span>
                               </div>
                               <h3 className="text-base font-bold text-white tracking-tight">{task.title}</h3>
                               <p className="text-xs text-white/60 mt-1 max-w-2xl">{task.description}</p>
                            </div>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:ml-auto w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
                            {isApproval ? (
                               <div className="flex w-full gap-2">
                                  <button 
                                    onClick={() => handleApproval(task.id, task.meta?.requestId, 'reject')}
                                    disabled={processingId === task.id}
                                    className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                                  >
                                     {processingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
                                  </button>
                                  <button 
                                    onClick={() => handleApproval(task.id, task.meta?.requestId, 'approve')}
                                    disabled={processingId === task.id}
                                    className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                  >
                                     {processingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                                  </button>
                               </div>
                            ) : (
                               <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest">
                                  Go to Task <ArrowRight className="w-4 h-4" />
                               </button>
                            )}
                         </div>
                      </motion.div>
                    )
                 })}
               </AnimatePresence>
            </div>
         )}
      </div>
    </div>
  )
}
