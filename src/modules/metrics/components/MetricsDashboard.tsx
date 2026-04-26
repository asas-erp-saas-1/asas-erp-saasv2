// src/modules/metrics/components/MetricsDashboard.tsx
'use client'

import { useEffect, useState } from 'react'

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(setMetrics)
  }, [])

  if (!metrics) return <div className="p-6">Loading metrics...</div>

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Advanced Analytics</h2>
      <pre className="bg-gray-800 text-green-400 p-4 rounded-xl overflow-auto text-xs">
        {JSON.stringify(metrics, null, 2)}
      </pre>
    </div>
  )
}
