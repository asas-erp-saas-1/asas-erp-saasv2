import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 px-6 text-center ${className || ""}`}
    >
      {Icon && (
        <div className="rounded-full bg-white/5 p-4">
          <Icon className="h-8 w-8 text-asas-gold" />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-asas-sand">{title}</h3>
        {description && (
          <p className="text-sm text-asas-silver max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
