import * as React from "react"
import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 ${className || ""}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-asas-gold" />}
          <h1 className="text-3xl font-bold text-asas-sand">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-asas-silver max-w-md">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
