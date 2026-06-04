import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva("w-full h-2 rounded-full overflow-hidden bg-white/10", {
  variants: {
    size: {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const progressBarVariants = cva("h-full rounded-full transition-all duration-500", {
  variants: {
    color: {
      default: "bg-asas-gold",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      error: "bg-rose-500",
      info: "bg-blue-500",
    },
  },
  defaultVariants: {
    color: "default",
  },
})

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number
  max?: number
  color?: "default" | "success" | "warning" | "error" | "info"
  showLabel?: boolean
  animated?: boolean
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      size,
      value,
      max = 100,
      color,
      showLabel = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div className="space-y-2">
        <div
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ color }),
              animated && "animate-pulse"
            )}
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
        {showLabel && (
          <p className="text-xs text-asas-silver text-right">
            {Math.round(percentage)}%
          </p>
        )}
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar, progressVariants, progressBarVariants }
