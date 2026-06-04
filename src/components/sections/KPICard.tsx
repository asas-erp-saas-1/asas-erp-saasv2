import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const kpiCardVariants = cva(
  "relative overflow-hidden rounded-xl border transition-all duration-200 group",
  {
    variants: {
      variant: {
        default: "bg-white/5 border-asas-silver/20 hover:bg-white/10 hover:border-asas-silver/40 hover:shadow-lg",
        highlighted: "bg-asas-gold/10 border-asas-gold/30 hover:bg-asas-gold/15 hover:shadow-lg",
        accent: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:shadow-lg",
        danger: "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15 hover:shadow-lg",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface KPICardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof kpiCardVariants> {
  icon?: LucideIcon
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  action?: React.ReactNode
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({
    className,
    variant,
    size,
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    action,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(kpiCardVariants({ variant, size }), className)}
        {...props}
      >
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-asas-silver uppercase tracking-wider">
                {title}
              </h3>
              {Icon && (
                <div
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    variant === "highlighted" && "bg-asas-gold/20",
                    variant === "accent" && "bg-emerald-500/20",
                    variant === "danger" && "bg-rose-500/20",
                    variant === "default" && "bg-white/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      variant === "highlighted" && "text-asas-gold",
                      variant === "accent" && "text-emerald-500",
                      variant === "danger" && "text-rose-500",
                      variant === "default" && "text-asas-gold"
                    )}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold text-asas-sand tracking-tight">
                {value}
              </div>
              {subtitle && (
                <p className="text-xs text-asas-silver">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-asas-silver/10">
            {trend && (
              <div
                className={cn(
                  "text-xs font-semibold flex items-center gap-1",
                  trend.isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
            {action && <div className="ml-auto">{action}</div>}
          </div>
        </div>

        {/* Decorative gradient background */}
        <div
          className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none",
            variant === "highlighted" && "bg-asas-gold",
            variant === "accent" && "bg-emerald-500",
            variant === "danger" && "bg-rose-500",
            variant === "default" && "bg-asas-gold"
          )}
          style={{
            transform: "translate(25%, -25%)",
          }}
        />
      </div>
    )
  }
)
KPICard.displayName = "KPICard"

export { KPICard, kpiCardVariants }
