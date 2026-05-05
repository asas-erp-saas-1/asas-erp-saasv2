import { Building2 } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
      <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
        <Building2 className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-3 font-display">Module Programmes (Projets)</h1>
      <p className="max-w-md text-sm leading-relaxed mb-8">
        Gestion globale des programmes immobiliers, regroupement de lots, suivi des chantiers et gestion de l'avancement "Projet".
      </p>
      <p className="text-xs uppercase tracking-widest font-bold text-blue-500/50">
        Prévu dans la Phase 2 de la Roadmap ASAS Promotion
      </p>
    </div>
  );
}
