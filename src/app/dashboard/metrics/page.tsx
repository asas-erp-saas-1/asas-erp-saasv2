// src/app/dashboard/metrics/page.tsx
import { Metadata } from 'next'
import { MetricsDashboard } from '@/modules/metrics/components/MetricsDashboard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Statistiques — ASAS RE-OS',
  description: 'Analyses avancées et métriques de performance',
}

export default async function MetricsPage() {
  // Server-side role guard — only manager/admin
  const db       = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes((profile as { role: string }).role)) {
    redirect('/dashboard/overview')
  }

  return (
    <div className="flex-1 text-gray-100 flex flex-col">
      <div className="w-full space-y-6">
        <div className="px-6 md:px-8 py-8 border-b border-white/5 bg-[#050505]">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                 <BarChart3 className="h-6 w-6 text-white" /> 
             </div>
             Analytique Stratégique
          </h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-2">Tendances de liquidité, analyses de risques et performance réseau.</p>
        </div>
        <div className="px-6 md:px-8 pb-12">
           <MetricsDashboard />
        </div>
      </div>
    </div>
  )
}
