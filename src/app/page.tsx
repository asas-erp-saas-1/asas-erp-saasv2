'use client'
import Link from 'next/link'
import { Building2, ArrowRight, ShieldCheck, BarChart3, Users, Zap, CheckCircle2, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-200 selection:text-blue-900 flex flex-col font-sans overflow-hidden">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A2A4A] to-blue-800 flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight font-display">ASAS</span>
          </div>
          <div className="flex items-center gap-5">
            <Link 
              href="/login" 
              className="text-sm font-bold text-gray-600 hover:text-[#1A2A4A] transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-bold bg-[#1A2A4A] text-white px-5 py-2.5 rounded-full hover:bg-[#243554] shadow-md shadow-[#1A2A4A]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 lg:px-8 pt-32 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* subtle grid background */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-8"
          >
            <span className="flex w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-gray-600 tracking-wide">ASAS OS 2.0 est maintenant disponible</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] max-w-4xl font-display"
          >
            Le système d'exploitation de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A2A4A] to-blue-600 inline-block mt-2">
              votre agence immobilière
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 text-xl text-gray-600 max-w-2xl font-medium leading-relaxed"
          >
            Un ERP SaaS conçu exclusivement pour les professionnels de l'immobilier. Gérez vos biens, vos leads, et vos commissions sur une seule plateforme sécurisée.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-[#1A2A4A] text-white rounded-full text-lg font-bold shadow-xl shadow-[#1A2A4A]/20 hover:shadow-2xl hover:bg-[#243554] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              Essai gratuit de 14 jours
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 border border-gray-200 rounded-full text-lg font-bold shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
            >
              Voir la démo
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 flex items-center gap-6 text-sm font-medium text-gray-500"
          >
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sans engagement</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Annulation à tout moment</div>
          </motion.div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="bg-white py-32 border-t border-gray-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-display mb-4">
                Tout ce dont vous avez besoin, <br className="hidden sm:block"/> réinventé pour la performance.
              </h2>
              <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
                Fini les feuilles de calcul éparpillées et les logiciels lents. ASAS regroupe l'essentiel dans une interface moderne et ultra-rapide.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                  <BarChart3 className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
                    <BarChart3 className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Analytiques Intelligents</h3>
                  <p className="text-gray-600 font-medium leading-relaxed max-w-md">
                    Suivez le pipeline de vos agents, le volume des ventes, et le ROI de vos campagnes marketing en temps réel avec des indicateurs de performance clés (KPIs) graphiques.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#1A2A4A] p-8 rounded-[2rem] shadow-sm col-span-1 relative overflow-hidden"
              >
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-sm border border-white/5">
                      <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Zero-Trust Security</h3>
                  </div>
                  <p className="text-blue-200 font-medium leading-relaxed">
                    Protection de niveau bancaire. Vos données et celles de vos clients sont isolées et chiffrées.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm col-span-1"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Vitesse Fulgurante</h3>
                <p className="text-gray-500 font-medium">Bâti avec Next.js 15, l'application est pensée pour des chargements instantanés et une navigation sans lag.</p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm col-span-1 md:col-span-2"
              >
                 <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Collaboration d'Équipe</h3>
                <p className="text-gray-500 font-medium">Répartissez les mandats, auditez les modifications des fiches clients, et calculez les commissions sans aucune friction.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center">
               <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-900 font-bold tracking-tight">ASAS OS</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">© {new Date().getFullYear()} ASAS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
