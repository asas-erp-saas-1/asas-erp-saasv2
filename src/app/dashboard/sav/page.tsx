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
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display uppercase">
           <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)]">
               <HardHat className="h-6 w-6 text-indigo-400" strokeWidth={1.5} /> 
           </div>
           Support & Tickets SAV
        </h1>
        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest pl-1 mt-2">Zillow Logic • Remises de Clés & Levée des réserves technique</p>
      </div>
      <SAVOverview />
    </div>
  )
}
