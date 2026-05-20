'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Calculator, Building2, Users, Handshake, ChevronRight, X, UserSquare2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { useDebounce } from 'use-debounce'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    const customOpen = () => setIsOpen(true)
    
    document.addEventListener('keydown', down)
    window.addEventListener('asas-omnibar-open', customOpen)
    
    return () => {
      document.removeEventListener('keydown', down)
      window.removeEventListener('asas-omnibar-open', customOpen)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([])
        return
      }
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        if (data.results) {
          setResults(data.results)
          setActiveIndex(0)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    search()
  }, [debouncedQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => (prev - 1 < 0 ? results.length - 1 : prev - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = results[activeIndex]
        if (selected) {
          router.push(selected.url)
          setIsOpen(false)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, activeIndex, router])

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users className="w-5 h-5 text-blue-500" />
      case 'client': return <UserSquare2 className="w-5 h-5 text-indigo-500" />
      case 'property': return <Building2 className="w-5 h-5 text-violet-500" />
      case 'deal': return <Handshake className="w-5 h-5 text-emerald-500" />
      default: return <Search className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ ease: "easeOut", duration: 0.2 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#141618] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-white/10">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher par nom, téléphone, ou matricule..."
                  className="flex-1 bg-transparent border-none outline-none text-base font-medium text-gray-900 dark:text-white placeholder-gray-400"
                />
                {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] items-center justify-center font-bold text-gray-500 bg-asas-sand/50 dark:bg-white/10 border border-gray-200 dark:border-white/5 rounded-md shadow-sm">ESC</kbd>
                <button onClick={() => setIsOpen(false)} className="sm:hidden p-1 bg-gray-100 dark:bg-white/10 rounded-md">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {results.length === 0 && query.length >= 2 && !isLoading && (
                  <div className="p-8 text-center text-sm font-medium text-gray-500">
                    Aucun résultat trouvé pour "{query}"
                  </div>
                )}
                
                {results.length === 0 && query.length < 2 && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2">Requêtes Rapides</p>
                    <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => { router.push('/dashboard/leads/new'); setIsOpen(false); }} className="flex flex-col text-left p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                           <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4"/> Nlle. Requête </span>
                           <span className="text-xs text-gray-500">Créer un nouveau prospect</span>
                         </button>
                         <button onClick={() => { router.push('/dashboard/clients'); setIsOpen(false); }} className="flex flex-col text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                           <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserSquare2 className="w-4 h-4"/> Base Clients</span>
                           <span className="text-xs text-gray-500">Rechercher contact direct</span>
                         </button>
                    </div>
                  </div>
                )}

                {results.length > 0 && (
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2 pt-2">Résultats Systèmes</p>
                     {results.map((item, index) => (
                       <button
                         key={`${item.type}-${item.id}`}
                         onClick={() => { router.push(item.url); setIsOpen(false); }}
                         onMouseEnter={() => setActiveIndex(index)}
                         className={clsx(
                           "w-full text-left flex items-center gap-4 p-3 rounded-xl transition-colors select-none",
                           activeIndex === index ? "bg-gray-100 dark:bg-white/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                         )}
                       >
                         <div className={clsx(
                             "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                             item.type === 'lead' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50' :
                             item.type === 'client' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/50' :
                             item.type === 'property' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/50' :
                             'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50'
                           )}>
                           {getIcon(item.type)}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
                         </div>
                         <div className="shrink-0 pl-2">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                         </div>
                       </button>
                     ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
