import { Building2, LayoutTemplate, ShieldCheck, HardHat, CalendarRange, ArrowRight, Activity, Percent } from "lucide-react"
import { motion, Variants } from "motion/react"

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

export default function ProjectsPage() {
  return (
    <div className="w-full relative pb-12">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 font-display">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Building2 className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            Programmes
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1 mt-2">
            Module de Pilotage Chantiers & Projets
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform active:scale-95 disabled:opacity-50" disabled>
             Nouveau Programme
           </button>
        </div>
      </motion.div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.8 }}
        className="bg-[#050505] border border-white/5 shadow-2xl rounded-[2.5rem] relative overflow-hidden"
      >
        
        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-transparent border-b border-white/10 p-8 relative overflow-hidden backdrop-blur-xl">
          <motion.div 
            initial={{ rotate: 0 }} 
            animate={{ rotate: 12 }} 
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-0 right-0 p-8 opacity-10"
          >
             <LayoutTemplate className="w-32 h-32" />
          </motion.div>
          <div className="relative z-10 max-w-xl">
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-widest rounded-full mb-4"
            >
              Phase 2 Roadmap ASAS
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-extrabold text-white mb-2 font-display"
            >
              Gestion Systémique des Projets
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm font-medium text-gray-400 leading-relaxed mb-6"
            >
              L'intégration complète du module "Programmes" est programmée. Ce module permettra d'orchestrer le développement foncier, le suivi administratif (permis, études), technique (avancement chantiers) et la consolidation des ventes.
            </motion.p>
          </div>
        </div>

        {/* Feature Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { icon: LayoutTemplate, title: "Découpage Parcellaire", desc: "Arborescence Projet > Bâtiments > Étages > Unités.", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: HardHat, title: "Suivi de Chantier", desc: "Rapports de progression visuels et synchronisation OS.", color: "text-amber-400", bg: "bg-amber-500/10" },
            { icon: Percent, title: "Appels de Fonds", desc: "Déclenchement financier selon l'avancement technique.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: ShieldCheck, title: "Gestion Documentaire", desc: "Centralisation des plans d'exécution et des permis.", color: "text-indigo-400", bg: "bg-indigo-500/10" },
          ].map((feature, i) => (
            <motion.div key={i} variants={item} className="p-6 bg-[#0A0A0A] border border-white/5 rounded-3xl hover:border-white/10 transition-colors group">
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sneak Peek Data */}
        <div className="p-8 border-t border-white/5 bg-[#030303]">
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> Environnement Simulés (Prototypes)
          </motion.h3>
          <motion.div 
            variants={container} 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true }} 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            
            {/* Project Card */}
            <motion.div variants={item} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-50 grayscale pointer-events-none">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-800 object-cover flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Résidence Atlas Premium</h4>
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1"><HardHat className="w-3 h-3" /> Structure en cours</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3" /> Liv. Q4 2026</span>
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="flex flex-col gap-2 w-full md:w-48">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Avancement</span>
                  <span>45%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "45%" }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-blue-500" />
                </div>
              </div>
            </motion.div>

            {/* Project Card */}
            <motion.div variants={item} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-50 grayscale pointer-events-none">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-800 object-cover flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Villa Horizon (Sidi Fredj)</h4>
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1"><HardHat className="w-3 h-3" /> Finitions</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3" /> Liv. Q1 2025</span>
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="flex flex-col gap-2 w-full md:w-48">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Avancement</span>
                  <span>85%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-blue-500" />
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>

      </motion.div>
    </div>
  )
}
