'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Phone, MessageCircle, Mail, MapPin, CheckCircle2, AlertTriangle, Clock, Building } from 'lucide-react'
import { clsx } from 'clsx'

export function AgentActionFeed({ actions = [] }: { actions?: any[] }) {
  const [items, setItems] = useState(actions.length > 0 ? actions : [])

  const handleComplete = async (id: string) => {
    // Optimistic update
    setItems(items.filter(item => item.id !== id))
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done', done_at: new Date().toISOString() })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\+/g, '')}`, '_blank')
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-asas-charcoal dark:text-asas-sand uppercase tracking-widest font-display">
            Flux d'Exécution <span className="opacity-40 text-asas-silver mx-1 font-sans">|</span> <span className="opacity-50">مهام التنفيذ</span>
            <span className="ml-2 text-asas-gold">({items.length})</span>
          </h2>
        </div>
      </div>
      
      <AnimatePresence>
        {items.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center bg-white dark:bg-[#141618] rounded-sm border border-asas-silver/20">
            <CheckCircle2 className="w-12 h-12 mx-auto text-asas-emerald mb-4 opacity-50" />
            <p className="text-sm font-medium text-asas-silver">Toutes les actions sont terminées. Excellent travail.</p>
          </motion.div>
        )}
        
        {items.map((item, idx) => (
          <motion.div 
            key={item.id} 
            layout 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, x: -100 }}
            className="group relative bg-white dark:bg-[#141618] border border-asas-silver/20 p-5 rounded-sm shadow-sm hover:border-asas-gold/30 transition-all flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className={clsx("w-10 h-10 rounded-sm flex items-center justify-center shrink-0", 
                  item.type === 'urgent' ? 'bg-red-500/10 text-red-500' :
                  item.type === 'whatsapp' ? 'bg-asas-emerald/10 text-asas-emerald' :
                  item.type === 'match' ? 'bg-asas-navy/10 text-asas-navy dark:text-asas-sand' :
                  'bg-asas-gold/10 text-asas-gold'
                )}>
                  {item.type === 'urgent' && <AlertTriangle className="w-5 h-5" />}
                  {item.type === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
                  {item.type === 'viewing' && <MapPin className="w-5 h-5" />}
                  {item.type === 'match' && <Building className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-asas-charcoal dark:text-asas-sand leading-tight">{item.task}</h3>
                  <p className="text-sm font-medium text-asas-silver mt-1">{item.leadName}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={clsx("text-[11px] font-bold px-2 py-1.5 rounded-sm tracking-wide uppercase", 
                  item.type === 'urgent' ? 'bg-red-500/10 text-red-500' : 'bg-black/5 dark:bg-white/5 text-asas-silver'
                )}>
                  {item.time}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-asas-silver/10 mt-2">
              <button 
                onClick={() => handleWhatsApp(item.phone)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-sm text-sm font-bold transition-colors active:scale-95"
              >
                <MessageCircle className="w-4 h-4" /> Message
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-asas-charcoal dark:text-asas-sand rounded-sm text-sm font-bold transition-colors active:scale-95"
              >
                <Phone className="w-4 h-4" /> Appel
              </button>
              <button 
                onClick={() => handleComplete(item.id)}
                className="px-4 py-2.5 bg-asas-charcoal hover:bg-black dark:bg-asas-sand dark:hover:bg-white text-asas-sand dark:text-asas-charcoal rounded-sm text-sm font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap border border-transparent"
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
