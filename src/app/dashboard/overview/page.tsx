// src/app/dashboard/overview/page.tsx
import { Metadata } from 'next'
import { CEODashboard } from '@/modules/overview/components/CEODashboard'
import { LayoutDashboard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Overview — ASAS RE-OS',
  description: 'Executive overview dashboard',
}

export default function OverviewPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3 font-display">
           <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-900/20">
               <LayoutDashboard className="h-6 w-6 text-white" strokeWidth={1.5} /> 
           </div>
           Vue d'ensemble
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">Centre de commandement exécutif</p>
      </div>
      <CEODashboard />
    </div>
  )
}
