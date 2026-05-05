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
    <div className="py-5 border-b border-white/5 last:border-0 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-200 transition-colors uppercase tracking-wide">{label}</p>
          {hint && <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-2">{hint}</p>}
        </div>
        <div className="shrink-0 flex items-center">
          {type === 'boolean' ? (
            <button
              onClick={() => onChange(!value)}
              className={clsx('relative h-8 w-14 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-[#050505]', value ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#171717] border border-white/5 hover:border-white/10')}
            >
              <span className={clsx('absolute top-0.5 h-7 w-7 rounded-full bg-white shadow-sm transition-transform', value ? 'translate-x-[26px]' : 'translate-x-0.5')} />
            </button>
          ) : (
            <input
              type="number"
              value={value as number}
              min={min}
              max={max}
              step={step ?? 1}
              onChange={e => onChange(Number(e.target.value))}
              className="w-28 text-right font-bold text-sm border border-white/10 rounded-xl px-4 py-2.5 bg-[#050505] text-white hover:bg-[#0A0A0A] focus:bg-[#050505] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
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
      .then(async r => {
        if (!r.ok) throw new Error(await r.text() || 'Failed to fetch config');
        return r.json();
      })
      .then(d => setConfig(d))
      .catch(err => {
        import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(err, { context: 'SettingsPage load' }))
      })
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
      if (!res.ok) throw new Error(await res.text() || 'Failed to save config')
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      import('@/lib/observability/errors').then(mod => mod.ErrorTracker.captureError(err, { context: 'SettingsPage save' }))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) return (
    <div className="flex-1 w-full max-w-4xl mx-auto space-y-6 bg-[#000000]">
      <div className="h-16 w-1/3 bg-[#0A0A0A] border border-white/5 rounded-2xl animate-pulse mb-8" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-[#0A0A0A] border border-white/5 rounded-3xl animate-pulse" />)}
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
    <div className="flex-1 font-sans text-gray-100 flex flex-col">
        <div className="w-full max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-display">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-white" />
                </div>
                Configuration Système
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-3">Règles métier, seuils d'inactivité et alertes financières.</p>
            </div>
            <button
            onClick={save}
            disabled={saving}
            className={clsx(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs uppercase font-bold tracking-widest shadow-lg transition-all focus:outline-none focus:ring-1 hover:scale-[1.02] active:scale-95',
                saved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 focus:ring-emerald-500/50' : 'bg-white text-black border border-transparent hover:bg-gray-200 focus:ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            )}
            >
            {saved ? <><Check className="h-4 w-4 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" /> Profil Sauvegardé</> : saving ? 'Cryptage...' : <><Save className="h-4 w-4" /> Appliquer Modification</>}
            </button>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Deal thresholds */}
            <motion.div variants={item} className="bg-[#050505] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className="w-24 h-24 text-orange-500" />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Protocoles d'Inactivité</h2>
            </div>
            <div className="space-y-2 relative z-10">
                <Field label="Latence tolérée (Heures)"   type="number" value={config.inactivityYellowHours}   min={1}   max={72}  onChange={v => update('inactivityYellowHours',   v as number)} hint="Délai avant notification de niveau 1" />
                <Field label="Risque élevé (Heures)"      type="number" value={config.inactivityRedHours}       min={24}  max={168} onChange={v => update('inactivityRedHours',       v as number)} hint="Action manuelle de l'opérateur requise" />
                <Field label="Rupture critique (Heures)" type="number" value={config.inactivityCriticalHours}  min={48}  max={720} onChange={v => update('inactivityCriticalHours',  v as number)} hint="Escalade automatique à la direction" />
            </div>
            </motion.div>

            {/* Financial thresholds */}
            <motion.div variants={item} className="bg-[#050505] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <CircleDollarSign className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CircleDollarSign className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Limites Financières</h2>
            </div>
            <div className="space-y-2 relative z-10">
                <Field label="Fond de Roulement (Survie)"   type="number" value={config.survivalThresholdDZD}  min={500_000}   step={100_000} onChange={v => update('survivalThresholdDZD',  v as number)} hint="Déclenche le blocage préventif des décaissements." />
                <Field label="Seuil d'Alerte Trésorerie"    type="number" value={config.cautionThresholdDZD}   min={1_000_000} step={100_000} onChange={v => update('cautionThresholdDZD',   v as number)} hint="Notification de risque de liquidité." />
            </div>
            </motion.div>

            {/* Commission */}
            <motion.div variants={item} className="bg-[#050505] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="w-24 h-24 text-blue-500" />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Modèle de Rémunération</h2>
            </div>
            <div className="space-y-2 relative z-10">
                <Field label="Taux Par Défaut (%)"   type="number" value={config.defaultCommissionPct} min={0} max={20}  step={0.5} onChange={v => update('defaultCommissionPct', v as number)} />
                <Field label="Plafond Autorisé (%)"       type="number" value={config.maxCommissionPct}     min={0} max={30}  step={0.5} onChange={v => update('maxCommissionPct',     v as number)} />
                <Field label="Double Validation Requise" type="boolean" value={config.commissionRequiresApproval} onChange={v => update('commissionRequiresApproval', v as boolean)} hint="Audit cryptographique de chaque accord" />
            </div>
            </motion.div>

            {/* Lead rules & Notifications */}
            <motion.div variants={item} className="space-y-8">
                <div className="bg-[#050505] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-24 h-24 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Acquisition & Distribution</h2>
                    </div>
                    <div className="space-y-2 relative z-10">
                        <Field label="Obsolescence Lead (Jours)"     type="number"  value={config.leadExpiryDays}    min={7}   max={365} onChange={v => update('leadExpiryDays',    v as number)} hint="Rotation automatique vers la file d'attente." />
                        <Field label="Capacité Max Actuelle"    type="number"  value={config.maxLeadsPerAgent}  min={1}   max={200} onChange={v => update('maxLeadsPerAgent',  v as number)} />
                    </div>
                </div>

                <div className="bg-[#050505] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Bell className="w-24 h-24 text-gray-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center">
                            <Bell className="h-5 w-5" />
                        </div>
                        <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Télémétrie d'Alerte</h2>
                    </div>
                    <div className="space-y-2 relative z-10">
                        <Field label="Alerte Direction sur Escalade" type="boolean" value={config.notifyManagerOnEscalation} onChange={v => update('notifyManagerOnEscalation', v as boolean)} />
                        <Field label="Routage WhatsApp API"        type="boolean" value={config.whatsappNotifications}     onChange={v => update('whatsappNotifications',     v as boolean)} hint="Nécessite la confirmation des tokens d'instance." />
                    </div>
                </div>
            </motion.div>

        </motion.div>
        </div>
    </div>
  )
}
