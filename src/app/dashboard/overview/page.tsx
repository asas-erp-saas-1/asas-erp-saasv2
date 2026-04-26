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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                 <LayoutDashboard className="h-5 w-5 text-blue-600" /> 
             </div>
             Vue d'ensemble
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Centre de commandement exécutif — intelligence d'affaires en temps réel.</p>
        </div>
        <CEODashboard />
      </div>
    </div>
  )
}
