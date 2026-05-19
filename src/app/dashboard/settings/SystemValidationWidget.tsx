'use client'

import { useState } from 'react'
import { Database, Zap, CheckCircle, RefreshCcw } from 'lucide-react'
import { clsx } from 'clsx'

export function SystemValidationWidget() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/system/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        throw new Error(data.error || 'Failed to seed data')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2rem] border border-blue-500/20 p-8 shadow-2xl relative overflow-hidden group mb-8">
      <div className="absolute top-0 right-0 p-6 opacity-10 blur-xl">
        <Database className="w-48 h-48 text-blue-300" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 font-display mb-2">
            <Zap className="h-5 w-5 text-blue-400" />
            Validation Staging (Pre-Release)
          </h2>
          <p className="text-sm font-medium text-blue-200/80 max-w-xl">
            Générez un ensemble complet de données opérationnelles (Promoteurs, Projets, Biens, Clients, Leads) pour valider l'architecture et les pipelines. Recommandé uniquement pour l'environnement de staging.
          </p>
          
          {error && <p className="mt-4 text-xs font-bold text-red-400 bg-red-400/10 px-3 py-2 rounded-lg inline-block border border-red-400/20">{error}</p>}
          {success && <p className="mt-4 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-lg inline-block flex items-center gap-2 border border-emerald-400/20"><CheckCircle className="w-4 h-4"/> Environnement provisionné avec succès !</p>}
        </div>
        
        <div className="shrink-0">
          <button
            onClick={handleSeed}
            disabled={loading || success}
            className={clsx(
              "flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold shadow-xl transition-all w-full md:w-auto justify-center",
              success 
                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                : "bg-white hover:bg-blue-50 hover:scale-105 active:scale-95 text-blue-900"
            )}
          >
            {loading ? (
              <><RefreshCcw className="w-5 h-5 animate-spin" /> Provisionnement...</>
            ) : success ? (
              <><CheckCircle className="w-5 h-5" /> Terminé</>
            ) : (
              <><Database className="w-5 h-5" /> Injecter Données de Test</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
