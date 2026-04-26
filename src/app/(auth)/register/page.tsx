// src/app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Check, Loader2, KeyRound, Mail, User } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router  = useRouter()
  const [form,    setForm]    = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
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

    // Regex check for strong password
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
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      // Auto-login active (email confirmation disabled)
      window.location.href = '/onboarding'
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const benefits = ['14 jours d\'essai gratuit', 'Aucune carte bancaire requise', 'Accès complet immédiat', 'Support client inclus']

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Vérifiez votre email</h2>
          <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">Un lien de confirmation sécurisé a été envoyé à votre adresse email. Veuillez cliquer pour activer votre compte.</p>
          <Link href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
            Aller à la page de connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[800px] flex flex-col md:flex-row bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Marketing Info */}
        <div className="md:w-5/12 bg-[#1A2A4A] p-10 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">ASAS</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4">Le futur de la<br/>gestion d'agence.</h2>
            <p className="text-blue-200 text-sm font-medium leading-relaxed">
              Sécurité Zero-Trust, pipelines optimisés, et une rentabilité maximisée, accessibles instantanément.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium text-blue-50">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-blue-300" />
                </div>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Form Registration */}
        <div className="md:w-7/12 p-8 sm:p-12 relative z-10 bg-white">
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
             <div className="w-10 h-10 rounded-xl bg-[#1A2A4A] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
             </div>
             <span className="text-xl font-bold tracking-tight text-gray-900">ASAS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Commencer l'aventure</h1>
            <p className="text-sm font-medium text-gray-500 mt-2">Créez votre compte pour configurer votre agence</p>
          </div>

          {error && (
             <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
               {error}
             </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nom complet</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={form.full_name} 
                  onChange={update('full_name')} 
                  required 
                  placeholder="Jean Dupont"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email professionnel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={update('email')} 
                  required 
                  placeholder="vous@agence.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mot de passe robuste</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={update('password')} 
                  required 
                  minLength={8} 
                  placeholder="8+ caractères, au moins 1 majuscule, 1 chiffre" 
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-[#1A2A4A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#243554] hover:shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 focus:ring-[#1A2A4A]/20"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Création de votre espace...' : 'Démarrer gratuitement'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-[#1A2A4A] font-bold hover:text-blue-700 hover:underline">
              Se connecter
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

