'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Phone, MessageCircle, Mail, MapPin, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { clsx } from 'clsx'

export function AgentActionFeed({ actions = [] }: { actions?: any[] }) {
  const [items, setItems] = useState(actions.length > 0 ? actions : [
    { id: '1', type: 'urgent', task: 'Rappeler Lead VIP', leadName: 'Atlas Invest Group', time: 'En retard (3h)', phone: '+213555000111' },
    { id: '2', type: 'whatsapp', task: 'Envoyer Photos Projet Y', leadName: 'Sarah B.', time: 'Aujourd\'hui 14:00', phone: '+213770123456' },
    { id: '3', type: 'viewing', task: 'Confirmer Visite F4', leadName: 'Karim M.', time: 'Demain 10:00', phone: '+213661987654' }
  ])

  const handleComplete = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\+/g, '')}`, '_blank')
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">Flux d'Exécution (<span className="text-blue-500">{items.length}</span>)</h2>
        </div>
      </div>
      
      <AnimatePresence>
        {items.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center bg-gray-50 dark:bg-[#111111] rounded-3xl border border-black/5 dark:border-white/5">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-4 opacity-50" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toutes les actions sont terminées. Excellent travail.</p>
          </motion.div>
        )}
        
        {items.map((item, idx) => (
          <motion.div 
            key={item.id} 
            layout 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, x: -100 }}
            className="group relative bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", 
                  item.type === 'urgent' ? 'bg-red-500/10 text-red-500' :
                  item.type === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-blue-500/10 text-blue-500'
                )}>
                  {item.type === 'urgent' && <AlertTriangle className="w-5 h-5" />}
                  {item.type === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
                  {item.type === 'viewing' && <MapPin className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{item.task}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{item.leadName}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-lg", 
                  item.type === 'urgent' ? 'bg-red-500/10 text-red-500' : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                )}>
                  {item.time}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button 
                onClick={() => handleWhatsApp(item.phone)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl text-sm font-bold transition-colors active:scale-95"
              >
                <MessageCircle className="w-4 h-4" /> Message
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors active:scale-95"
              >
                <Phone className="w-4 h-4" /> Appel
              </button>
              <button 
                onClick={() => handleComplete(item.id)}
                className="px-4 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap"
              >
                Terminer
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
