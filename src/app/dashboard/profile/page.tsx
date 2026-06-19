// src/app/dashboard/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Building2, Save, Camera, Key, Bell, Shield, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import Image from 'next/image'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Dummy data simulating kernel output for now over API (or direct in prod)
  const [profile, setProfile] = useState<any>({
    full_name: 'Amine',
    email: 'amine@asas.dz',
    phone: '+213 555 123 456',
    role: 'Agent Senior',
    department: 'Ventes',
    avatar_url: null,
    address: 'Alger Centre',
    notifications: {
      email: true,
      whatsapp: true,
      push: false
    }
  })

  useEffect(() => {
    // In actual use, fetch from /api/profile or similar
    setTimeout(() => setLoading(false), 800)
  }, [])

  const saveProfile = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  if (loading) return (
    <div className="flex-1 w-full max-w-4xl mx-auto space-y-6 pt-4 animate-pulse">
       <div className="h-32 bg-[#051121] rounded-2xl border border-white/5" />
       <div className="h-96 bg-[#051121] rounded-2xl border border-white/5" />
    </div>
  )

  return (
    <div className="flex-1 font-sans text-white flex flex-col pt-0 sm:pt-4">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
             <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-[#051121] border border-white/10 overflow-hidden flex items-center justify-center relative">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <span className="text-3xl font-display font-bold text-asas-gold">{profile.full_name?.charAt(0) || 'U'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                     <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-[3px] border-[#0A1629]" title="Statut: Actif" />
             </div>
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-widest">{profile.full_name}</h1>
               <p className="text-[10px] text-asas-gold font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                 <Building2 className="w-3 h-3" /> {profile.role} • {profile.department}
               </p>
             </div>
          </div>
          <button
              onClick={saveProfile}
              disabled={saving}
              className={clsx(
                  'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] sm:text-xs uppercase font-bold tracking-widest transition-all focus:outline-none cursor-pointer border shadow-sm w-full sm:w-auto',
                  saved ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white hover:bg-white/10 border-white/10'
              )}
          >
              {saved ? <><Check className="h-4 w-4" /> Enregistré</> : saving ? 'Sauvegarde...' : <><Save className="h-4 w-4" /> Enregistrer</>}
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2 space-y-6">
              
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#051121] rounded-2xl border border-white/5 p-6 sm:p-8">
                 <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <User className="w-4 h-4" /> Informations Personnelles
                 </h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[9px] uppercase tracking-widest font-bold text-white/70">Nom Complet</label>
                     <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-asas-gold focus:outline-none transition-colors" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] uppercase tracking-widest font-bold text-white/70">Fonction</label>
                     <input type="text" value={profile.role} disabled className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/50 cursor-not-allowed" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] uppercase tracking-widest font-bold text-white/70">Email Professionnel</label>
                     <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                       <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-asas-gold focus:outline-none transition-colors" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] uppercase tracking-widest font-bold text-white/70">Téléphone Direct</label>
                     <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                       <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-asas-gold focus:outline-none transition-colors" />
                     </div>
                   </div>
                 </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#051121] rounded-2xl border border-white/5 p-6 sm:p-8">
                 <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Key className="w-4 h-4" /> Sécurité du Compte
                 </h2>
                 <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-asas-gold/10 flex items-center justify-center shrink-0">
                       <Shield className="w-5 h-5 text-asas-gold" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                       <h3 className="text-sm font-bold text-white font-display">Mot de Passe</h3>
                       <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Dernière modification il y a 4 mois</p>
                    </div>
                    <button className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                       Changer
                    </button>
                 </div>
              </motion.div>

           </div>

           <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-[#051121] rounded-2xl border border-white/5 p-6">
                 <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Bell className="w-4 h-4" /> Notifications
                 </h2>
                 <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer group">
                       <div>
                         <p className="text-xs font-bold text-white uppercase tracking-widest">Email Journalier</p>
                         <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Résumé des tâches du jour</p>
                       </div>
                       <div className={clsx("w-10 h-5 rounded-full transition-colors relative shadow-inner", profile.notifications.email ? "bg-asas-gold" : "bg-white/10")}>
                          <span className={clsx("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", profile.notifications.email ? "translate-x-5" : "translate-x-1")} />
                       </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                       <div>
                         <p className="text-xs font-bold text-white uppercase tracking-widest">Alertes WhatsApp</p>
                         <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Pour les leads urgents</p>
                       </div>
                       <div className={clsx("w-10 h-5 rounded-full transition-colors relative shadow-inner", profile.notifications.whatsapp ? "bg-[#25D366]" : "bg-white/10")}>
                          <span className={clsx("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", profile.notifications.whatsapp ? "translate-x-5" : "translate-x-1")} />
                       </div>
                    </label>
                 </div>
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  )
}
