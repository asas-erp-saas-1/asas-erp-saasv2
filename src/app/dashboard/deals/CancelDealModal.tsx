'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { X, Frown, DollarSign, Users, ShieldAlert, Building } from 'lucide-react'
import { clsx } from 'clsx'

type CancelReason = 'price_too_high' | 'lost_to_competitor' | 'financing_failed' | 'seller_backed_out' | 'other'

const REASONS: { id: CancelReason, label: string, icon: any, color: string }[] = [
  { id: 'price_too_high', label: 'Prix Trop Élevé', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'lost_to_competitor', label: 'Perdu / Concurrent', icon: Building, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'financing_failed', label: 'Financement Rejeté', icon: ShieldAlert, color: 'text-red-500 bg-red-500/10' },
  { id: 'seller_backed_out', label: 'Vendeur Rétracté', icon: Users, color: 'text-purple-500 bg-purple-500/10' },
]

export function CancelDealModal({ dealId, dealVersion, onClose, onSuccess }: { dealId: string, dealVersion: number, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectReason = async (reason: CancelReason) => {
    setLoading(true)
    setError(null)
    try {
      const { updateDealStageAction } = await import('@/actions/dealActions')
      const res = await updateDealStageAction(dealId, 'cancelled', dealVersion, { lostReason: reason })
      
      if (!res.success) throw new Error(res.error)
      
      onSuccess()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-white dark:bg-[#0A0A0A] rounded-[2rem] shadow-2xl border border-black/10 dark:border-white/10 p-6 flex flex-col"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full">
          <X className="w-4 h-4" />
        </button>
        
        <div className="w-12 h-12 bg-gray-100 dark:bg-[#111111] rounded-2xl flex items-center justify-center mb-4">
          <Frown className="w-6 h-6 text-gray-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">Pourquoi cette transaction a-t-elle échoué ?</h2>
        <p className="text-sm text-gray-500 font-medium mb-6">
          Un clic suffit. Ces données aident à ajuster notre stratégie d'acquisition de leads et de biens.
        </p>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-xl">{error}</div>}

        <div className="space-y-2">
          {REASONS.map(reason => {
            const Icon = reason.icon
            return (
              <button
                key={reason.id}
                onClick={() => handleSelectReason(reason.id)}
                disabled={loading}
                className={clsx(
                  "w-full flex items-center gap-3 p-3 rounded-xl border border-black/5 dark:border-white/5 transition-all text-left group hover:scale-[1.02]",
                  loading ? "opacity-50 cursor-not-allowed" : "hover:border-black/20 dark:hover:border-white/20 bg-gray-50 dark:bg-[#111111] hover:bg-white dark:hover:bg-[#1A1A1A]"
                )}
              >
                <div className={clsx("w-8 h-8 rounded-lg flex flex-shrink-0 items-center justify-center", reason.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{reason.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
