// src/modules/metrics/components/MetricsDashboard.tsx
import { getMetricsData } from '@/actions/metricActions'

export async function MetricsDashboard() {
  const metrics = await getMetricsData();

  return (
    <div className="bg-[#0A0A0A] rounded-[2rem] border border-white/5 p-8 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20v2H2z" /><path d="M4 18l4-8 4 4 6-10h4v18H4z" /></svg>
      </div>
      <h2 className="text-xl font-extrabold text-white mb-6 tracking-tight relative z-10">Diagnostic du Réseau</h2>
      <div className="bg-[#050505] rounded-xl border border-white/10 p-4 relative z-10 custom-scrollbar max-h-[600px] overflow-auto">
        <pre className="text-emerald-400 text-[11px] font-mono leading-relaxed">
          {JSON.stringify(metrics, null, 2)}
        </pre>
      </div>
    </div>
  )
}
