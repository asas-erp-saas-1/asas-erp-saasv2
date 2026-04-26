// src/app/dashboard/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Settings, Save, Check, Bell, CircleDollarSign, AlertTriangle, ShieldCheck, Zap } from 'lucide-react'
import { motion, Variants } from 'motion/react'
import { clsx } from 'clsx'

type Config = {
  inactivityYellowHours:    number
  inactivityRedHours:       number
  inactivityCriticalHours:  number
  survivalThresholdDZD:     number
  cautionThresholdDZD:      number
  defaultCommissionPct:     number
  maxCommissionPct:         number
  commissionRequiresApproval: boolean
  leadExpiryDays:           number
  maxLeadsPerAgent:         number
  monteCarloIterations:     number
  forecastWindowMonths:     number
  whatsappNotifications:    boolean
  notifyManagerOnEscalation: boolean
  agencyName:               string | null
  currency:                 string
  timezone:                 string
}

function Field({ label, type, value, onChange, min, max, step, hint }: {
  label: string; type: string; value: number | string | boolean; min?: number; max?: number; step?: number; hint?: string
  onChange: (v: number | string | boolean) => void
}) {
  return (
    <div className="py-4 border-b border-gray-50 last:border-0 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800 transition-colors">{label}</p>
          {hint && <p className="text-xs font-medium text-gray-500 mt-1">{hint}</p>}
        </div>
        <div className="shrink-0 flex items-center">
          {type === 'boolean' ? (
            <button
              onClick={() => onChange(!value)}
              className={clsx('relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2', value ? 'bg-blue-600' : 'bg-gray-200')}
            >
              <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', value ? 'translate-x-[22px]' : 'translate-x-0.5')} />
            </button>
          ) : (
            <input
              type="number"
              value={value as number}
              min={min}
              max={max}
              step={step ?? 1}
              onChange={e => onChange(Number(e.target.value))}
              className="w-28 text-right font-medium text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [config,  setConfig]  = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => setConfig(d))
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof Config>(key: K, val: Config[K]) {
    setConfig(c => c ? { ...c, [key]: val } : c)
    setSaved(false)
  }

  async function save() {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(config),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      <div className="h-16 w-1/3 bg-gray-100 rounded-2xl animate-pulse mb-8" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />)}
    </div>
  )

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-gray-700" />
            </div>
            Paramètres de l'Agence
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">La configuration de l'agence — tous les changements sont versionnés et audités selon les principes zero-trust.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={clsx(
            'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4',
            saved ? 'bg-emerald-500 text-white focus:ring-emerald-500/20' : 'bg-[#1A2A4A] text-white hover:bg-[#243554] hover:shadow focus:ring-[#1A2A4A]/20'
          )}
        >
          {saved ? <><Check className="h-4 w-4" /> Enregistré !</> : saving ? 'Enregistrement…' : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
        </button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Deal thresholds */}
        <motion.div variants={item} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Seuils d'inactivité (Transactions)</h2>
          </div>
          <div className="space-y-1">
            <Field label="Alerte jaune (heures)"   type="number" value={config.inactivityYellowHours}   min={1}   max={72}  onChange={v => update('inactivityYellowHours',   v as number)} hint="Heures d'inactivité avant avertissement mineur" />
            <Field label="Alerte rouge (heures)"      type="number" value={config.inactivityRedHours}       min={24}  max={168} onChange={v => update('inactivityRedHours',       v as number)} hint="Action requise de l'agent" />
            <Field label="Alerte critique (heures)" type="number" value={config.inactivityCriticalHours}  min={48}  max={720} onChange={v => update('inactivityCriticalHours',  v as number)} hint="Escalade au manager" />
          </div>
        </motion.div>

        {/* Financial thresholds */}
        <motion.div variants={item} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CircleDollarSign className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Seuils Financiers (DZD)</h2>
          </div>
          <div className="space-y-1">
            <Field label="Seuil de survie"   type="number" value={config.survivalThresholdDZD}  min={500_000}   step={100_000} onChange={v => update('survivalThresholdDZD',  v as number)} hint="En dessous → Déclenche le Mode Survie (Blocage de dépenses)" />
            <Field label="Seuil de prudence"    type="number" value={config.cautionThresholdDZD}   min={1_000_000} step={100_000} onChange={v => update('cautionThresholdDZD',   v as number)} hint="En dessous → Déclenche le Mode Prudence" />
          </div>
        </motion.div>

        {/* Commission */}
        <motion.div variants={item} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Règles de Commission</h2>
          </div>
          <div className="space-y-1">
            <Field label="Commission par défaut (%)"   type="number" value={config.defaultCommissionPct} min={0} max={20}  step={0.5} onChange={v => update('defaultCommissionPct', v as number)} />
            <Field label="Commission maximale (%)"       type="number" value={config.maxCommissionPct}     min={0} max={30}  step={0.5} onChange={v => update('maxCommissionPct',     v as number)} />
            <Field label="Nécessite approbation du manager" type="boolean" value={config.commissionRequiresApproval} onChange={v => update('commissionRequiresApproval', v as boolean)} hint="Force l'audit des contrats de commission" />
          </div>
        </motion.div>

        {/* Lead rules & Notifications */}
        <motion.div variants={item} className="space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Règles des Leads</h2>
                </div>
                <div className="space-y-1">
                    <Field label="Expiration des leads (jours)"     type="number"  value={config.leadExpiryDays}    min={7}   max={365} onChange={v => update('leadExpiryDays',    v as number)} hint="Temps avant réattribution automatique" />
                    <Field label="Max leads actifs par agent"    type="number"  value={config.maxLeadsPerAgent}  min={1}   max={200} onChange={v => update('maxLeadsPerAgent',  v as number)} />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Bell className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                </div>
                <div className="space-y-1">
                    <Field label="Notifier le manager sur escalade" type="boolean" value={config.notifyManagerOnEscalation} onChange={v => update('notifyManagerOnEscalation', v as boolean)} />
                    <Field label="Notifications WhatsApp"        type="boolean" value={config.whatsappNotifications}     onChange={v => update('whatsappNotifications',     v as boolean)} hint="Nécessite l'intégration WhatsApp API" />
                </div>
            </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
