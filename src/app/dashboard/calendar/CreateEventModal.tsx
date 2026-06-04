import { useState } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { X, Calendar as CalendarIcon, Clock, Link as LinkIcon, Loader2 } from 'lucide-react'
import { getAccessToken } from '@/lib/google-auth'

export function CreateEventModal({ onClose, onSuccess, selectedDate }: { onClose: () => void, onSuccess: () => void, selectedDate: Date }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(selectedDate.toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Non authentiqué avec Google')
      }

      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString()
      const endDateTime = new Date(`${date}T${endTime}:00`).toISOString()

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: title,
          description: description,
          start: {
            dateTime: startDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la création de l\'événement Google')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#051121] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[450px] overflow-hidden flex flex-col font-sans"
      >
        <div className="p-2 border-b border-white/5 flex items-center justify-between bg-[#0A1829]/60 backdrop-blur-md">
          <div className="flex items-center gap-3 pl-3">
            <div className="bg-asas-gold/10 p-1.5 rounded-lg border border-asas-gold/20">
              <CalendarIcon className="w-4 h-4 text-asas-gold" />
            </div>
            <h2 className="text-[10px] font-bold text-white uppercase tracking-widest">
              Nouvel Événement
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-xl mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-bold rounded-xl">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center gap-4 relative">
               <div className="w-8 shrink-0 flex items-center justify-center opacity-0"><CalendarIcon className="w-5 h-5"/></div>
               <div className="w-full relative">
                 <input 
                   required
                   aria-label="Ajouter un titre"
                   type="text" 
                   value={title}
                   onChange={e => setTitle(e.target.value)}
                   className="w-full bg-transparent border-b border-white/10 px-0 py-3 text-xl font-display text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-0 leading-tight transition-colors"
                   placeholder="Ajouter un titre"
                   autoFocus
                 />
                 <div className={clsx("absolute bottom-0 left-0 right-0 h-0.5 bg-asas-gold transition-transform origin-left scale-x-0 duration-300", title ? "scale-x-100" : "")}></div>
               </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 pt-2.5 shrink-0 flex items-center justify-center text-white/30"><Clock className="w-5 h-5" /></div>
            <div className="flex-1 space-y-4">
              <input 
                required
                aria-label="Date"
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-asas-gold/40 text-white transition-colors w-full sm:w-fit [color-scheme:dark]"
              />
              
              <div className="flex items-center gap-3">
                <input 
                  required
                  aria-label="Heure de début"
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-asas-gold/40 text-white transition-colors flex-1 [color-scheme:dark]"
                />
                <span className="text-white/30 font-bold">-</span>
                <input 
                  required
                  aria-label="Heure de fin"
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-asas-gold/40 text-white transition-colors flex-1 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 pt-2.5 shrink-0 flex items-center justify-center text-white/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <textarea 
              aria-label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] uppercase tracking-wider font-bold focus:outline-none focus:border-asas-gold/40 text-white placeholder:text-white/20 transition-colors resize-none h-28"
              placeholder="Ajouter une description"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center justify-center min-w-[120px] gap-2 px-6 py-2.5 bg-asas-gold text-[#06152D] hover:bg-[#b58c42] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(212,166,79,0.2)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#06152D]" /> : "Enregistrer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
