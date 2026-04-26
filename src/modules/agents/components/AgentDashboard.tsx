// src/modules/agents/components/AgentDashboard.tsx
'use client'
import { useEffect, useState } from 'react'

export function AgentDashboard({ agentId, agentName }: { agentId: string, agentName: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/agents/kpis?view=snapshot&agentId=${agentId}`)
      .then(r => r.json()).then(setData)
  }, [agentId])

  if (!data) return <div className="p-6">Loading profile...</div>

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl m-6">
      <h2 className="text-xl font-bold mb-4">{agentName} Performance</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Pipeline Closed</p>
          <p className="text-2xl font-bold text-gray-900">{data.closed_deals} deals</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Sales Conversion</p>
          <p className="text-2xl font-bold text-blue-600">{data.close_rate_pct}%</p>
        </div>
      </div>
    </div>
  )
}
