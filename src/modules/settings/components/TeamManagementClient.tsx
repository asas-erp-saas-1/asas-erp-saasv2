'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Users, Shield, ShieldAlert, ShieldCheck, Mail, ArrowLeft, CheckCircle2, UserX } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

type Profile = {
  id: string
  full_name: string
  email: string
  role: 'owner' | 'manager' | 'agent'
  status: 'active' | 'suspended'
  last_active: string | null
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Administrateur',
  manager: 'Manager',
  agent: 'Agent Commercial',
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <ShieldAlert className="w-4 h-4 text-purple-500" />,
  manager: <ShieldCheck className="w-4 h-4 text-blue-500" />,
  agent: <Shield className="w-4 h-4 text-gray-500" />
}

export function TeamManagementClient({ initialProfiles, currentUserRole }: { initialProfiles: Profile[], currentUserRole: string }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [processing, setProcessing] = useState<string | null>(null)

  const handleRoleChange = async (profileId: string, newRole: string) => {
    setProcessing(profileId)
    try {
      const res = await fetch(`/api/settings/team/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_role', role: newRole })
      })
      if (!res.ok) throw new Error('Role update failed')
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole as any } : p))
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la modification du rôle.")
    } finally {
      setProcessing(null)
    }
  }

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    setProcessing(profileId)
    try {
      const res = await fetch(`/api/settings/team/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_status', status: newStatus })
      })
      if (!res.ok) throw new Error('Status update failed')
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: newStatus as any } : p))
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la suspension.")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto space-y-8 font-sans">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Link href="/dashboard/settings" className="p-2 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-display">
            <Users className="h-6 w-6 text-indigo-500" /> Gestion des Accès (RBAC)
          </h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Contrôle des rôles et autorisations d'équipe</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
             <thead className="bg-gray-50 dark:bg-[#050505] border-b border-black/5 dark:border-white/5">
                <tr>
                   <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500">Utilisateur</th>
                   <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500">Contact</th>
                   <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500">Rôle RBAC</th>
                   <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500">Statut</th>
                   <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-black/5 dark:divide-white/5">
                <AnimatePresence>
                   {profiles.map((p) => {
                     const isProcessing = processing === p.id;
                     return (
                        <motion.tr 
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={clsx(
                             "group transition-colors",
                             isProcessing ? "opacity-50 pointer-events-none" : "hover:bg-gray-50 dark:hover:bg-[#111111]"
                          )}
                        >
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">
                                    {p.full_name.charAt(0).toUpperCase() || 'U'}
                                 </div>
                                 <span className="font-bold text-gray-900 dark:text-white">{p.full_name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                 <Mail className="w-4 h-4" /> {p.email}
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                {ROLE_ICONS[p.role]}
                                <select 
                                   disabled={currentUserRole !== 'owner' || p.role === 'owner'}
                                   value={p.role}
                                   onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                   className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer appearance-none disabled:opacity-50"
                                >
                                   <option value="owner" disabled>Administrateur</option>
                                   <option value="manager">Manager</option>
                                   <option value="agent">Agent Commercial</option>
                                </select>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              {p.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                                  <UserX className="w-3 h-3" /> Suspendu
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-5 text-right">
                              {currentUserRole === 'owner' && p.role !== 'owner' && (
                                 <button
                                   onClick={() => handleStatusChange(p.id, p.status === 'active' ? 'suspended' : 'active')}
                                   className={clsx(
                                      "text-xs font-bold transition-colors px-3 py-1.5 rounded-lg",
                                      p.status === 'active' ? "text-red-500 hover:bg-red-500/10" : "text-emerald-500 hover:bg-emerald-500/10"
                                   )}
                                 >
                                   {p.status === 'active' ? 'Suspendre' : 'Réactiver'}
                                 </button>
                              )}
                           </td>
                        </motion.tr>
                     )
                   })}
                </AnimatePresence>
             </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
