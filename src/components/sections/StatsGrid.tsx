import * as React from "react"
import { KPICard, type KPICardProps } from "./KPICard"

interface StatsGridProps {
  items: Omit<KPICardProps, "ref">[]
  cols?: number
  className?: string
}

export function StatsGrid({
  items,
  cols = 4,
  className = "",
}: StatsGridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div
      className={`grid ${colsClass[cols as keyof typeof colsClass] || colsClass[4]} gap-6 ${className}`}
    >
      {items.map((item, idx) => (
        <KPICard
          key={idx}
          {...item}
        />
      ))}
    </div>
  )
}
