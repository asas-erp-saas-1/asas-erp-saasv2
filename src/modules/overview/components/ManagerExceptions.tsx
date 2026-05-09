'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, ArrowRightLeft, CheckCircle2, TrendingUp, Users } from 'lucide-react'
import { clsx } from 'clsx'

export function ManagerExceptions() {
  const [exceptions, setExceptions] = useState([
    { id: '1', leadName: 'Atlas Invest Group', issue: 'Sans contact > 48h', agent: 'Amine B.', severity: 'high' },
    { id: '2', leadName: 'Villa Hydra - Visite', issue: 'Aucune note post-visite', agent: 'Sarah M.', severity: 'medium' },
    { id: '3', leadName: 'Dossier K. Ahmed', issue: 'Offre expirée ce soir', agent: 'Karim L.', severity: 'high' }
  ])

  const [agents] = useState(['Amine B.', 'Sarah M.', 'Karim L.', 'Yassine R.'])
  const [reassigningId, setReassigningId] = useState<string | null>(null)

  const handleReassign = (exceptionId: string, newAgent: string) => {
    // In reality this would call the kernel to transfer ownership
    // kernel.mutate('leads', 'UPDATE', { assigned_agent: newAgent }, { id: exceptionId })
    setExceptions(prev => prev.filter(e => e.id !== exceptionId))
    setReassigningId(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Red Zone */}
      <div className="bg-red-500/5 dark:bg-[#1A0505] border border-red-500/20 rounded-[2rem] p-8 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-red-600 dark:text-red-400 tracking-tight leading-none uppercase">Zone Rouge</h3>
            <p className="text-xs font-bold text-red-500/70 mt-1">Interventions urgentes requises</p>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {exceptions.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500">Aucune exception critique. Opérations saines.</p>
              </motion.div>
            )}
            {exceptions.map(exception => (
              <motion.div 
                key={exception.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-red-500/20 shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none">{exception.leadName}</h4>
                    <p className="text-xs font-bold text-red-500 mt-1.5">{exception.issue}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-[#1A1A1A] px-2 py-1 rounded-md">{exception.agent}</span>
                </div>

                {reassigningId === exception.id ? (
                  <div className="flex items-center gap-2 pt-3 border-t border-red-500/10">
                    <select 
                      className="flex-1 text-sm bg-gray-50 dark:bg-[#050505] border border-black/10 dark:border-white/10 rounded-lg px-2 py-1.5 outline-none focus:border-red-500"
                      onChange={(e) => handleReassign(exception.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Choisir un agent...</option>
                      {agents.filter(a => a !== exception.agent).map(a => (
                        <option key={a} value={a}>{a} (Dispo)</option>
                      ))}
                    </select>
                    <button onClick={() => setReassigningId(null)} className="text-xs font-bold text-gray-500 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">Annuler</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReassigningId(exception.id)}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 tracking-wide"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Réassignation Rapide
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Green Zone */}
      <div className="bg-emerald-500/5 dark:bg-[#051A0A] border border-emerald-500/20 rounded-[2rem] p-8 relative overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none uppercase">Zone Verte</h3>
            <p className="text-xs font-bold text-emerald-500/70 mt-1">Pulse Revenus & Trésorerie</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-white dark:bg-[#111111] border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Offres en attente</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">3</p>
            <p className="text-[10px] font-bold text-emerald-500 mt-1">Signatures prévues (48h)</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Encaissements</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">12.4M</p>
            <p className="text-[10px] font-bold text-emerald-500 mt-1">DZD attendus cette semaine</p>
          </div>
          <div className="col-span-2 bg-[#050505] border border-emerald-500/30 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-widest">Liquidité Net</p>
                <p className="text-3xl font-mono font-bold tracking-tighter">45.2M <span className="text-base text-gray-400">DZD</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Engagements</p>
                <p className="text-sm font-mono font-bold text-gray-300">-8.5M DZD</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
