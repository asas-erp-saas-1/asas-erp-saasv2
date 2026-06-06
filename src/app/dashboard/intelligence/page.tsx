import { Metadata } from 'next'
import IntelligenceWorkspace from './IntelligenceWorkspace'
import { Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Décisions & Prévisions — ASAS RE-OS',
  description: 'Moteur d\'intelligence prévisionnelle et d\'aide à la décision stratégique',
}

export default function IntelligencePage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3 font-display uppercase">
          <div className="w-14 h-14 rounded-xl bg-asas-gold/10 border border-asas-gold/20 flex items-center justify-center shadow-[0_0_15px_rgba(212,166,79,0.15)]">
            <Award className="h-6 w-6 text-asas-gold" strokeWidth={1.5} /> 
          </div>
          Décisions & Prévisions
        </h1>
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-[68px]">
          Moteur Prévisionnel & Pilotage Financier de l'Entreprise de Promotion Immobilière
        </p>
      </div>

      <IntelligenceWorkspace />
    </div>
  )
}
