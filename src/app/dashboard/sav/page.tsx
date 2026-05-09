import { Metadata } from 'next'
import { HardHat } from 'lucide-react'
import { SAVOverview } from '@/modules/sav/components/SAVOverview'

export const metadata: Metadata = {
  title: 'SAV & Livraisons — ASAS RE-OS',
  description: 'Gestion des remises de clés et réserves (SAV)',
}

export default function SAVPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3 font-display">
           <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
               <HardHat className="h-6 w-6 text-white" strokeWidth={1.5} /> 
           </div>
           SAV & Livraisons
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">Remises de Clés & Levée des réserves technique</p>
      </div>
      <SAVOverview />
    </div>
  )
}
