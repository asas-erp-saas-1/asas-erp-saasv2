// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2, Mail, KeyRound, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[800px] flex flex-col md:flex-row bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Marketing Info */}
        <div className="md:w-5/12 bg-[#1A2A4A] p-10 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden">
          <div className="absolute -bottom-24 -left-24 p-8 opacity-10">
            <Building2 className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">ASAS</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4">Content de vous<br/>revoir.</h2>
            <p className="text-blue-200 text-sm font-medium leading-relaxed">
              Accédez à votre espace de travail sécurisé et reprenez le contrôle de votre agence immobilière.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm font-medium italic text-blue-100 mb-4">
              "ASAS a complètement transformé notre façon de gérer nos biens et nos commissions."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                J
              </div>
              <div>
                <p className="text-xs font-bold text-white">Jean Dubois</p>
                <p className="text-xs text-blue-300">Directeur d'Agence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Login */}
        <div className="md:w-7/12 p-8 sm:p-12 relative z-10 bg-white flex flex-col justify-center">
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
             <div className="w-10 h-10 rounded-xl bg-[#1A2A4A] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
             </div>
             <span className="text-xl font-bold tracking-tight text-gray-900">ASAS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connexion à votre compte</h1>
            <p className="text-sm font-medium text-gray-500 mt-2">Authentification Enterprise Zero-Trust</p>
          </div>

          {error && (
             <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
               {error}
             </div>
          )}

          {/* Social Sign-in */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mb-6 flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google Workspace
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">Où utiliser un email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email professionnel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="vous@agence.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Mot de passe</label>
                <Link href="#" className="text-xs font-bold text-blue-600 hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-10 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-[#1A2A4A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#243554] hover:shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 focus:ring-[#1A2A4A]/20"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Authentification en cours...' : 'Se connecter'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-[#1A2A4A] font-bold hover:text-blue-700 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
      <p className="text-center text-xs font-medium text-gray-400 mt-6">
        Vos données sont chiffrées selon les standards de l'industrie militaire.
      </p>
    </div>
  )
}

