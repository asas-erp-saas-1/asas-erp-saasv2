// src/app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Check, Loader2 } from 'lucide-react'
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

    setSuccess(true)
    setLoading(false)
  }

  const benefits = ['14 jours d\'essai gratuit', 'Aucune carte bancaire requise', 'Accès complet immédiat', 'Support par WhatsApp inclus']

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
          <p className="text-sm text-gray-500">Nous vous avons envoyé un lien de confirmation. Vous devez le cliquer avant de pouvoir vous connecter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1A2A4A] rounded-xl mb-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Commencer gratuitement</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Votre nom complet</label>
              <input type="text" value={form.full_name} onChange={update('full_name')} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email professionnel</label>
              <input type="email" value={form.email} onChange={update('email')} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" value={form.password} onChange={update('password')} required minLength={8} placeholder="8+ caractères, au moins 1 majuscule, 1 chiffre" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-[#1A2A4A] text-white rounded-lg text-sm font-semibold hover:bg-[#243554] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Création en cours…' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

