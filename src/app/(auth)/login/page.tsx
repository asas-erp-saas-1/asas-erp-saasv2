'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2, Mail, KeyRound, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (authErr) {
      setError('Identifiants invalides ou email non vérifié.')
      setLoading(false)
      return
    }

    if (data?.user && !data.session) {
      setError('Email non vérifié. Veuillez vérifier votre boîte de réception.')
      setLoading(false)
      return
    }

    window.location.href = '/dashboard/overview'
  }

  async function handleGoogleLogin() {
    setError(null)
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard/overview`
      }
    })
    
    if (authErr) {
      setError('Erreur lors de la connexion via Google.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-gray-50 to-gray-50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[900px] flex flex-col md:flex-row bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden"
      >
        
        {/* Marketing Info */}
        <div className="md:w-5/12 bg-gradient-to-br from-[#1A2A4A] to-[#0f192b] p-10 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden">
          <div className="absolute -bottom-24 -left-24 p-8 opacity-5 transform rotate-12">
            <Building2 className="w-[400px] h-[400px]" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-md border border-white/10">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight font-display">ASAS</span>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-4 font-display">Content de vous<br/>revoir.</h2>
            <p className="text-blue-100/80 text-sm font-medium leading-relaxed max-w-xs">
              Accédez à votre espace de travail sécurisé et reprenez le contrôle de votre agence immobilière.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-md shadow-2xl">
            <p className="text-sm font-medium italic text-blue-50 mb-5 leading-relaxed">
              "ASAS a complètement transformé notre façon de gérer nos biens et nos commissions. L'interface est incroyablement rapide."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shadow-inner">
                JD
              </div>
              <div>
                <p className="text-sm font-bold text-white">Jean Dubois</p>
                <p className="text-xs font-medium text-blue-200/80">Directeur d'Agence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Login */}
        <div className="md:w-7/12 p-8 sm:p-14 relative z-10 bg-white flex flex-col justify-center">
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
             <div className="w-10 h-10 rounded-xl bg-[#1A2A4A] flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-extrabold tracking-tight text-gray-900 font-display">ASAS</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">Connexion</h1>
            <p className="text-sm font-medium text-gray-500 mt-2">Authentification Enterprise Zero-Trust</p>
          </div>

          {error && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 flex items-center gap-2">
               {error}
             </motion.div>
          )}

          {/* Social Sign-in */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mb-8 flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all shadow-sm group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google Workspace
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="px-4 bg-white text-gray-400 font-bold">Ou utiliser un email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email professionnel</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="vous@agence.com"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">Mot de passe</label>
                <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">Mot de passe oublié ?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-[#1A2A4A] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#243554] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 focus:ring-[#1A2A4A]/20"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Authentification...' : 'Se connecter sécurisement'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-[#1A2A4A] font-bold hover:text-blue-700 hover:underline transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </motion.div>
      <p className="text-center text-xs font-medium text-gray-400 mt-8 flex items-center justify-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Vos données sont chiffrées de bout en bout
      </p>
    </div>
  )
}

