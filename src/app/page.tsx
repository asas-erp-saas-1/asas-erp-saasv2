'use client'
import Link from 'next/link'
import { Building2, ArrowRight, ShieldCheck, BarChart3, Users, Zap, CheckCircle2, ChevronRight, Globe, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-blue-500/30 selection:text-blue-200 flex flex-col font-sans overflow-hidden text-gray-100">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0A0A0A]/60 backdrop-blur-2xl border-b border-white/5 supports-[backdrop-filter]:bg-[#0A0A0A]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-800 border border-white/10 flex items-center justify-center relative z-10">
                <Building2 className="w-5 h-5 text-gray-100" strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight font-display">ASAS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/register" 
              className="relative group inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white transition-all duration-300"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-90 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></span>
              <span className="relative flex items-center gap-2">Commencer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 pt-24">
        <section className="relative px-4 sm:px-6 lg:px-8 pt-24 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-2xl mb-10 backdrop-blur-md"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-300 tracking-wide">ASAS OS 2.0 est maintenant disponible en Europe & MENA</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tighter leading-[1.05] max-w-5xl font-display"
          >
            Le système nerveux de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 inline-block mt-2">
              votre agence immobilière.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 text-xl font-medium text-gray-400 max-w-2xl leading-relaxed"
          >
            L'ERP SaaS pensé pour l'ère de l'IA. Unifiez vos biens, vos transactions et le management de vos collaborateurs sur la plateforme la plus rapide et sécurisée au monde.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
          >
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              Créer mon espace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full text-lg font-bold hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5 opacity-70" />
              Accéder à la Démo
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest"
          >
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gray-400" /> Zéro Configuration</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gray-400" /> Architecture Sécurisée</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gray-400" /> Temps réel</div>
          </motion.div>
        </section>

        {/* Features Grids */}
        <section className="relative py-32 border-t border-white/5 bg-[#050505]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display mb-6">
                Ingénierie de précision, <br className="hidden sm:block"/> design minimaliste.
              </h2>
              <p className="text-lg text-gray-400 font-medium max-w-2xl mx-auto">
                ASAS réinvente l'ERP immobilier. Dites adieu aux interfaces surchargées et aux temps de chargement interminables des logiciels traditionnels.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-b from-gray-900 to-black p-10 rounded-[2.5rem] border border-white/5 shadow-2xl col-span-1 md:col-span-2 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700">
                  <BarChart3 className="w-64 h-64" />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <BarChart3 className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Intelligence Financière</h3>
                  <p className="text-gray-400 font-medium leading-relaxed max-w-md text-lg">
                    Analytiques en temps réel, prévisions de cash-flow et calcul automatique des commissions. Ne pilotez plus à vue, pilotez avec des certitudes.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-indigo-950 via-gray-900 to-black p-8 rounded-[2.5rem] border border-white/5 shadow-2xl col-span-1 relative overflow-hidden"
              >
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
                      <Lock className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight">Zero-Trust Vault</h3>
                  </div>
                  <p className="text-indigo-200/70 font-medium leading-relaxed text-lg">
                    Chiffrement AES-256 et architecture isolée (Row Level Security). Vos données clients ne sont visibles que par vous.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-b from-gray-900 to-black p-8 rounded-[2.5rem] border border-white/5 shadow-2xl col-span-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
                  <Zap className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight">Vitesse Next Gen</h3>
                <p className="text-gray-400 font-medium text-lg leading-relaxed">
                  Architecture Serverless Node.js et Edge CDN. Le système répond en millisecondes, partout dans le monde.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-b from-gray-900 to-black p-10 rounded-[2.5rem] border border-white/5 shadow-2xl col-span-1 md:col-span-2 relative overflow-hidden"
              >
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                  <Users className="w-96 h-96 text-white" />
                </div>
                <div className="relative z-10">
                 <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8">
                    <Users className="w-8 h-8 text-purple-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Espace Collaboratif Asynchrone</h3>
                  <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
                    Assignez des leads, suivez les visites et partagez l\'historique des communications clients sans jamais utiliser WhatsApp ou l\'email. Tout est archivé.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
               <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-white font-extrabold tracking-widest uppercase text-sm">ASAS RE-OS</span>
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-wide">© {new Date().getFullYear()} ASAS SYSTEM. Tous droits de propriété intellectuelle réservés.</p>
        </div>
      </footer>
    </div>
  )
}

