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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                 <BarChart3 className="h-5 w-5 text-blue-600" /> 
             </div>
             Statistiques & Analytique
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Tendances des revenus, analyses des risques et performance des agents.</p>
        </div>
        <div className="px-6 md:px-8">
           <MetricsDashboard />
        </div>
      </div>
    </div>
  )
}
