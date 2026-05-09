import { Metadata } from 'next'
import { InteractiveCanvas } from '@/modules/projects/components/InteractiveCanvas'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Plan Interactif — ASAS RE-OS',
  description: 'Canvas temps-réel du plan de masse',
}

export default function ProjectCanvasPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center gap-4 mb-4 shrink-0">
         <Link href={`/dashboard/projects/${params.id}`} className="p-2 bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
         </Link>
         <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" /> Plan de Masse / Stacking Plan
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Maquette Interactive</p>
         </div>
      </div>
      
      <div className="flex-1 bg-gray-50 dark:bg-[#050505] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden relative shadow-inner">
         <InteractiveCanvas projectId={params.id} />
      </div>
    </div>
  )
}
