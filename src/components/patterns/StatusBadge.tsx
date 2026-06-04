import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
  {
    variants: {
      status: {
        active:
          "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
        pending:
          "bg-amber-500/15 text-amber-500 border border-amber-500/30",
        inactive:
          "bg-asas-silver/15 text-asas-silver border border-asas-silver/30",
        rejected:
          "bg-rose-500/15 text-rose-500 border border-rose-500/30",
        success:
          "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
        warning:
          "bg-amber-500/15 text-amber-500 border border-amber-500/30",
        error:
          "bg-rose-500/15 text-rose-500 border border-rose-500/30",
        info:
          "bg-asas-gold/15 text-asas-gold border border-asas-gold/30",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  showDot?: boolean
  label?: string
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, showDot = true, label, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {showDot && <Circle className="h-2 w-2 fill-current" />}
      {label || children}
    </div>
  )
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
