import { Metadata } from 'next'
import { MetricsDashboard } from '@/modules/metrics/components/MetricsDashboard'
import { BarChart2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Statistiques — ASAS RE-OS',
  description: 'Analyse avancée des performances',
}

export default function MetricsPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 font-display">
           <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)]">
               <BarChart2 className="h-6 w-6 text-white" strokeWidth={1.5} /> 
           </div>
           Statistiques
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">Diagnostic du Réseau et Performances</p>
      </div>
      <MetricsDashboard />
    </div>
  )
}
