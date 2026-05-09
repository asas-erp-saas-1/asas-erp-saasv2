'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, LayoutTemplate, ShieldCheck, HardHat, CalendarRange, ArrowRight, Activity, Percent, Plus, Search } from "lucide-react"
import { motion, Variants } from "motion/react"
import { clsx } from 'clsx'
import Link from 'next/link'
import { ProjectCreateModal } from './ProjectCreateModal'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

interface Project {
  id: string
  name: string
  city: string | null
  status: string
  completion_date: string | null
  developers: { name: string } | null
  properties: { id: string, status: string }[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      
      const res = await fetch(`/api/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.data || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="w-full relative pb-12">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-display">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Building2 className="h-6 w-6 text-gray-900 dark:text-white" strokeWidth={1.5} />
            </div>
            Programmes
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1 mt-2">
            Module de Pilotage Chantiers & Projets
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform active:scale-95 disabled:opacity-50">
             <Plus className="w-4 h-4" /> Nouveau Programme
           </button>
        </div>
      </motion.div>

      {isModalOpen && (
        <ProjectCreateModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); load() }} 
        />
      )}

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.8 }}
        className="bg-gray-50 dark:bg-[#050505] border border-black/5 dark:border-white/5 shadow-2xl rounded-[2.5rem] relative overflow-hidden"
      >
        {/* Statistics Banner */}
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-transparent border-b border-black/10 dark:border-white/10 p-8 relative overflow-hidden backdrop-blur-xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
              Opérations de Promotion
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 font-display">Performance Globale des Programmes</h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Vue consolidée de l'avancement technique de vos chantiers et de la structuration foncière. Pilotez vos appels de fonds en corrélant l'avancement travaux et la commercialisation.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { icon: LayoutTemplate, title: "Découpage Parcellaire", desc: "Arborescence Projet > Bâtiments > Étages > Unités.", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: HardHat, title: "Suivi de Chantier", desc: "Rapports de progression visuels et état d'avancement.", color: "text-amber-400", bg: "bg-amber-500/10" },
            { icon: Percent, title: "Appels de Fonds", desc: "Déclenchement financier selon l'avancement technique.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: ShieldCheck, title: "Gestion Documentaire", desc: "Centralisation des plans d'exécution et des permis.", color: "text-indigo-400", bg: "bg-indigo-500/10" },
          ].map((feature, i) => (
            <motion.div key={i} variants={item} className="p-6 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-3xl hover:border-black/10 dark:border-white/10 transition-colors group">
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="text" placeholder="Rechercher un programme..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all font-medium placeholder:text-gray-600" />
            </div>
          </div>
        </div>

        {/* Active Projects Data */}
        <div className="p-8 border-t border-black/5 dark:border-white/5 bg-[#030303]">
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Programmes ({projects.length})
            </div>
          </motion.h3>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[1, 2].map(i => <div key={i} className="h-32 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-black/5 dark:border-white/5 animate-pulse" />)}
             </div>
          ) : projects.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white dark:bg-[#0A0A0A] rounded-3xl border border-black/5 dark:border-white/5 border-dashed">
                <Building2 className="h-10 w-10 text-white/20 mb-4" />
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucun programme</p>
                <p className="text-xs uppercase tracking-widest">Ajoutez des projets immobiliers pour commencer</p>
             </div>
          ) : (
            <motion.div 
              variants={container} 
              initial="hidden" 
              whileInView="show" 
              viewport={{ once: true }} 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {projects.map((project) => {
                const totalProps = project.properties?.length || 0;
                const soldProps = project.properties?.filter(p => p.status === 'sold').length || 0;
                const progressPct = totalProps > 0 ? Math.round((soldProps / totalProps) * 100) : 0;
                
                return (
                  <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
                    <motion.div variants={item} className="bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:border-black/10 dark:border-white/10 transition-colors cursor-pointer group h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-900 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors truncate">{project.name}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
                            <span className={clsx("flex items-center gap-1", project.status === 'active' ? 'text-emerald-400' : '')}>
                              <HardHat className="w-3 h-3" /> {project.status === 'active' ? 'En cours' : project.status}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate"><LayoutTemplate className="w-3 h-3" /> {totalProps} lots</span>
                            {project.completion_date && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3" /> Liv. {new Date(project.completion_date).getFullYear()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress (Commercialization) */}
                      <div className="flex flex-col gap-2 w-full xl:w-48 shrink-0">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                          <span>Commercialisation</span>
                          <span className="text-blue-400">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${progressPct}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-blue-500" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
