'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [agencyName, setAgencyName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [userRole, setUserRole] = useState('')
  const [agencySize, setAgencySize] = useState('1-5')
  const supabase = createBrowserSupabaseClient()

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!agencyName.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Create agency using our secure Postgres RPC
      const { data, error: rpcError } = await supabase.rpc('create_agency', { 
        agency_name: agencyName,
        phone_number: phoneNumber || null,
        user_role_title: userRole || null
      })

      if (rpcError) {
        throw new Error(rpcError.message || "Impossible de créer l'agence.")
      }

      setStep(2) // Success step
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        window.location.href = '/dashboard/overview'
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Une erreur inattendue est survenue.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1A2A4A] rounded-2xl shadow-sm mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenue sur ASAS</h1>
          <p className="text-gray-500 mt-2 font-medium">Configurons votre espace de travail</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm overflow-hidden relative">
          
          {/* Step 1: Create Workspace */}
          <div className={`transition-all duration-500 transform ${step === 1 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute inset-0 p-8 pointer-events-none'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nouvelle Agence</h2>
                <p className="text-sm text-gray-500">Donnez un nom à votre organisation</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom de l'agence
                </label>
                <input 
                  type="text" 
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="Ex: ASAS Immobilier" 
                  autoFocus
                  required
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+213..." 
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Votre rôle
                  </label>
                  <select 
                    value={userRole}
                    onChange={e => setUserRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Directeur">Directeur / Gérant</option>
                    <option value="Agent">Agent Immobilier</option>
                    <option value="Administratif">Administratif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Taille de l'agence
                </label>
                <div className="flex gap-2">
                  {['1-5', '6-20', '21-50', '50+'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setAgencySize(size)}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${
                        agencySize === size 
                          ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !agencyName.trim()} 
                className="w-full mt-4 py-3.5 bg-[#1A2A4A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#243554] hover:shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 focus:ring-[#1A2A4A]/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Step 2: Success */}
          <div className={`transition-all duration-500 transform ${step === 2 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0 p-8 pointer-events-none'}`}>
            <div className="flex flex-col items-center justify-center h-full text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">C'est prêt !</h2>
              <p className="text-gray-500 font-medium">Votre espace de travail a été configuré avec succès. Redirection vers le tableau de bord...</p>
              
              <div className="mt-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#1A2A4A] animate-spin" />
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs font-medium text-gray-400 mt-6">
          Sécurisé par le système de chiffrement Enterprise d'ASAS
        </p>
      </div>
    </div>
  )
}
