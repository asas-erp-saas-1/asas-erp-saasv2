import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const priorityVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
  {
    variants: {
      priority: {
        low: "bg-blue-500/15 text-blue-500 border border-blue-500/30",
        medium:
          "bg-amber-500/15 text-amber-500 border border-amber-500/30",
        high: "bg-rose-500/15 text-rose-500 border border-rose-500/30",
        critical:
          "bg-red-600/20 text-red-500 border border-red-600/40 animate-pulse",
      },
    },
    defaultVariants: {
      priority: "medium",
    },
  }
)

export interface PriorityIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priorityVariants> {
  showIcon?: boolean
  label?: string
}

const PriorityIndicator = React.forwardRef<
  HTMLDivElement,
  PriorityIndicatorProps
>(({ className, priority, showIcon = true, label, children, ...props }, ref) => {
  const iconMap = {
    low: null,
    medium: TrendingUp,
    high: AlertCircle,
    critical: AlertCircle,
  }

  const Icon = showIcon && iconMap[priority!]
  const labels = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    critical: "Critique",
  }

  return (
    <div
      ref={ref}
      className={cn(priorityVariants({ priority }), className)}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label || children || labels[priority!]}
    </div>
  )
})
PriorityIndicator.displayName = "PriorityIndicator"

export { PriorityIndicator, priorityVariants }
