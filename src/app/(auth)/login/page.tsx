// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'

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

    // 1. Sign In via Supabase Auth ONLY (Zero-Trust)
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (authErr) {
      // Return generic error, no leakage
      setError('Identifiants invalides ou email non vérifié.')
      setLoading(false)
      return
    }

    if (data?.user && !data.session) {
      setError('Email non vérifié. Veuillez vérifier votre boîte de réception.')
      setLoading(false)
      return
    }

    // Rely on AuthContext to hydrate the profile and session.
    // Replace instead of push to prevent back navigation loop
    window.location.href = '/dashboard/overview'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1A2A4A] rounded-xl mb-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ASAS Login Sécurisé</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Authentification Enterprise Zero-Trust</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Se connecter</h2>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vous@agence.com"
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-md">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-[#1A2A4A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#243554] hover:shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 focus:ring-[#1A2A4A]/20"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Authentification…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

