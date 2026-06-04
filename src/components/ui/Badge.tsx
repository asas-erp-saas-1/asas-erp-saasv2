import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-asas-gold",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-asas-gold/15 text-asas-gold",
        secondary:
          "border-transparent bg-white/10 text-asas-sand",
        destructive:
          "border-transparent bg-rose-500/15 text-rose-500",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-500",
        warning:
          "border-transparent bg-amber-500/15 text-amber-500",
        info:
          "border-transparent bg-blue-500/15 text-blue-500",
        outline: "border-asas-silver/30 bg-transparent text-asas-silver",
        ghost: "border-transparent text-asas-silver hover:text-asas-sand",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
