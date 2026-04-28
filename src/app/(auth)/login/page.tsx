'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2, Mail, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

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
      let errorMessage = 'Identifiants invalides ou profil non accrédité.'
      if (authErr.message.includes('Invalid API key') || authErr.message.includes('invalid api key')) {
        errorMessage = "Erreur: Clé API Supabase invalide. Si vous êtes sur Vercel, assurez-vous d'avoir préfixé les variables par 'NEXT_PUBLIC_' et d'avoir REDÉPLOYÉ l'application."
      }
      setError(errorMessage)
      setLoading(false)
      return
    }

    if (data?.user && !data.session) {
      setError('Profil non vérifié. Veuillez consulter votre centre de communication crypté (email).')
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
      let errorMessage = 'Erreur lors de la connexion via Google Workspace.'
      if (authErr.message.includes('provider is not enabled')) {
        errorMessage = "L'authentification Google n'est pas activée dans votre projet Supabase. Activez-la dans le tableau de bord Supabase (Authentication -> Providers)."
      } else if (authErr.message.includes('Invalid API key') || authErr.message.includes('invalid api key')) {
        errorMessage = "Erreur: Clé API Supabase manquante ou invalide. Vérifiez vos variables d'environnement."
      }
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 relative overflow-y-auto text-gray-100 bg-[#050505]">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1000px] flex flex-col md:flex-row bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden relative z-10"
      >
        
        {/* Marketing Info */}
        <div className="md:w-5/12 bg-gradient-to-br from-gray-900 to-black p-12 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden border-r border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-5 transform -rotate-12 translate-x-1/4 -translate-y-1/4">
             <Building2 className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight font-display">ASAS</span>
            </Link>
            <h2 className="text-4xl font-extrabold leading-tight mb-4 font-display tracking-tight">Accès<br/>Autorisé.</h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px]">
              Protocole de connexion sécurisé au réseau ASAS OS.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur-md">
            <p className="text-sm font-medium italic text-gray-300 mb-6 leading-relaxed">
              "ASAS effectue 3 millions de transactions quotidiennes sans la moindre faille. Une ingénierie de précision."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold shadow-inner">
                JD
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">Jean Dubois</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">Directeur d'Agence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Login */}
        <div className="md:w-7/12 p-8 sm:p-14 relative z-10 bg-transparent flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-10">
             <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-extrabold tracking-tight text-white font-display">ASAS</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">Connexion</h1>
            <p className="text-sm font-bold text-gray-400 mt-3 uppercase tracking-widest">Authentification Enterprise Zero-Trust</p>
          </div>

          {error && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-bold text-red-400 flex items-center gap-3 backdrop-blur-md">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
               {error}
             </motion.div>
          )}

          {/* Social Sign-in */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mb-8 flex items-center justify-center gap-3 px-4 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-sm font-bold text-white transition-all group"
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
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="px-4 bg-[#0A0A0A] text-gray-500 rounded-full">Protocol email standard</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Identité réseau</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="nom@agence.com"
                  className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Clé de Déchiffrement</label>
                <Link href="#" className="text-xs font-bold text-blue-400 hover:text-white transition-colors">Perte d'accès ?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-14 pr-14 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white focus:outline-none p-2 rounded-xl hover:bg-white/10 transition-colors">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-8 bg-white text-black rounded-full text-sm font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 transition-all"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Vérification...' : 'Émuler Session Sécurisée'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Pas encore initié ?{' '}
            <Link href="/register" className="text-white font-bold hover:underline transition-all">
              Créer un espace privé
            </Link>
          </p>
        </div>
      </motion.div>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-8 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Architecture Zero-Trust & Chiffrement RLS
      </p>
    </div>
  )
}

