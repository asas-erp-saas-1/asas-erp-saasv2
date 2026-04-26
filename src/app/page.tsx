import Link from 'next/link'
import { Building2, ArrowRight, ShieldCheck, BarChart3, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A2A4A] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">ASAS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-gray-600 hover:text-[#1A2A4A] transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-semibold bg-[#1A2A4A] text-white px-4 py-2 rounded-xl hover:bg-[#243554] shadow-sm transition-all focus:ring-4 focus:ring-[#1A2A4A]/20"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 lg:px-8 pt-24 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">ASAS OS 2.0 est disponible</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0D1829] tracking-tight leading-tight max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both">
            Le CRM Immobilier <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              nouvelle génération
            </span>
          </h1>
          
          <p className="mt-8 text-xl text-gray-500 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 fill-mode-both">
            Pilotez votre agence immobilière avec une précision chirurgicale. Leads, transactions, commissions et analytiques centralisés sur une seule plateforme sécurisée.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500 fill-mode-both">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-[#1A2A4A] text-white rounded-2xl text-lg font-bold shadow-xl shadow-[#1A2A4A]/20 hover:shadow-2xl hover:bg-[#243554] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#1A2A4A] border-2 border-gray-100 rounded-2xl text-lg font-bold shadow-sm hover:border-gray-200 hover:bg-gray-50 transition-all text-center"
            >
              Espace client
            </Link>
          </div>
        </section>

        {/* Features Grids */}
        <section className="bg-gray-50/50 border-t border-gray-100 py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
                  title: 'Sécurité Zero-Trust',
                  description: 'Vos données sont protégées par RLS (Row Level Security) strict. Chaque agence est isolée au niveau de la base de données.'
                },
                {
                  icon: <Zap className="w-6 h-6 text-orange-500" />,
                  title: 'Ultra-Rapide',
                  description: 'Architecture moderne React & Next.js 15, garantissant des temps de réponse instantanés pour une productivité maximale.'
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-emerald-600" />,
                  title: 'Analytiques Poussés',
                  description: 'Suivez le CA, les commissions et la performance de vos agents en temps réel avec des tableaux de bord interactifs.'
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500 font-semibold tracking-tight">ASAS OS</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">© {new Date().getFullYear()} ASAS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
