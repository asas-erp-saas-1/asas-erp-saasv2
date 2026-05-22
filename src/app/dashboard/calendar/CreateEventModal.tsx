import { useState } from 'react'
import { motion } from 'motion/react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#141618] border border-asas-silver/20 rounded-sm shadow-xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-asas-silver/20 flex items-center justify-between bg-asas-sand/50 dark:bg-black/10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-asas-charcoal dark:text-asas-sand flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#4285F4]" />
            Nouvel Événement Google
          </h2>
          <button onClick={onClose} className="p-1 text-asas-silver hover:text-asas-charcoal dark:hover:text-asas-sand transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-asas-silver mb-1.5">Titre de l'événement <span className="text-red-500">*</span></label>
            <input 
              required
              aria-label="Titre"
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-black/20 border border-asas-silver/30 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-asas-gold text-asas-charcoal dark:text-asas-sand transition-colors"
              placeholder="Ex: Réunion Client avec M. Yassine"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-asas-silver mb-1.5 flex items-center gap-1.5">
                 <CalendarIcon className="w-3 h-3" /> Date <span className="text-red-500">*</span>
               </label>
               <input 
                 required
                 aria-label="Date"
                 type="date" 
                 value={date}
                 onChange={e => setDate(e.target.value)}
                 className="w-full bg-white dark:bg-black/20 border border-asas-silver/30 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-asas-gold text-asas-charcoal dark:text-asas-sand transition-colors"
               />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-asas-silver mb-1.5 flex items-center gap-1.5">
                   <Clock className="w-3 h-3" /> Début <span className="text-red-500">*</span>
                 </label>
                 <input 
                   required
                   aria-label="Heure de début"
                   type="time" 
                   value={startTime}
                   onChange={e => setStartTime(e.target.value)}
                   className="w-full bg-white dark:bg-black/20 border border-asas-silver/30 rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-asas-gold text-asas-charcoal dark:text-asas-sand transition-colors"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-asas-silver mb-1.5 flex items-center gap-1.5">
                   <Clock className="w-3 h-3" /> Fin <span className="text-red-500">*</span>
                 </label>
                 <input 
                   required
                   aria-label="Heure de fin"
                   type="time" 
                   value={endTime}
                   onChange={e => setEndTime(e.target.value)}
                   className="w-full bg-white dark:bg-black/20 border border-asas-silver/30 rounded-sm px-2 py-2 text-sm focus:outline-none focus:border-asas-gold text-asas-charcoal dark:text-asas-sand transition-colors"
                 />
               </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-asas-silver mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3 h-3" /> Description
            </label>
            <textarea 
              aria-label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-black/20 border border-asas-silver/30 rounded-sm px-3 py-2 text-sm h-24 focus:outline-none focus:border-asas-gold text-asas-charcoal dark:text-asas-sand transition-colors resize-none"
              placeholder="Détails de l'événement..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-asas-silver hover:text-asas-charcoal dark:hover:text-asas-sand transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-[#4285F4] text-white hover:bg-[#3367D6] font-bold text-sm rounded-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
              Créer Événement
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
