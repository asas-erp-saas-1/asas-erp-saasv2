'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Check, Loader2, KeyRound, Mail, User, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { motion } from 'motion/react'

export default function RegisterPage() {
  const router  = useRouter()
  const [form,    setForm]    = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess]  = useState(false)
  const supabase = createBrowserSupabaseClient()

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!/(?=.*[A-Z])(?=.*\d)/.test(form.password) || form.password.length < 8) {
      setError('Password must be at least 8 characters and include a number and an uppercase letter.')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
        }
      }
    })

    if (authError) {
      let errorMessage = authError.message
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid api key')) {
        errorMessage = "Erreur: Clé API Supabase invalide. Si vous êtes sur Vercel, assurez-vous d'avoir préfixé les variables par 'NEXT_PUBLIC_' et d'avoir REDÉPLOYÉ l'application."
      }
      setError(errorMessage)
      setLoading(false)
      return
    }

    if (data.session) {
      window.location.href = '/onboarding'
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setError(null)
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`
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

  const benefits = ['14 jours d\'essai premium', 'Architecture Zero-Trust', 'Calcul automatique commissions', 'Support VIP']

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center px-4 py-8 relative overflow-y-auto text-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-10 shadow-2xl text-center relative z-10"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <Check className="h-10 w-10 text-green-400" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3 font-display tracking-tight">Vérifiez votre email</h2>
          <p className="text-sm font-medium text-gray-400 leading-relaxed mb-8">Un lien de confirmation chiffré a été envoyé à votre adresse. Veuillez valider pour initialiser votre base de données isolée.</p>
          <Link href="/login" className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-black rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
            Aller au Portail de Connexion
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 relative overflow-y-auto text-gray-100 bg-[#050505]">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
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
            <ShieldCheck className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight font-display">ASAS</span>
            </Link>
            <h2 className="text-4xl font-extrabold leading-tight mb-6 font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
              L'immobilier, <br/>sans compromis.
            </h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px]">
              Déployez un environnement collaboratif de classe entreprise en moins de 2 minutes.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-4 text-sm font-bold text-gray-300">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                </div>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Form Registration */}
        <div className="md:w-7/12 p-8 sm:p-14 relative z-10 bg-transparent flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-10">
             <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-extrabold tracking-tight text-white font-display">ASAS</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">Initialiser l'OS</h1>
            <p className="text-sm font-bold text-gray-400 mt-3 uppercase tracking-widest">Création de profil administrateur</p>
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

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Identité Administrateur</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={form.full_name} 
                  onChange={update('full_name')} 
                  required 
                  placeholder="Ex: Jean Dupont"
                  className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Professionnel</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={update('email')} 
                  required 
                  placeholder="contact@agence.com"
                  className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Clé de chiffrement (Mot de passe)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                </div>
                <input 
                  type={showPw ? 'text' : 'password'}
                  value={form.password} 
                  onChange={update('password')} 
                  required 
                  minLength={8} 
                  placeholder="8+ car., Majusc., Chiffre" 
                  className={showPw ? "w-full pl-14 pr-14 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600" : "w-full pl-14 pr-14 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-600 text-security-disc"} 
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
              {loading ? 'Génération de l\'environnement...' : 'Déployer l\'OS'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Autorisation existante ?{' '}
            <Link href="/login" className="text-white font-bold hover:underline transition-all">
              Authentifiez-vous
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

