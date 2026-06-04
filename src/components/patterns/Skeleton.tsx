import * as React from "react"
import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md bg-white/10 animate-pulse",
      className
    )}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

// Preset skeleton layouts for common use cases
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`p-6 border border-asas-silver/20 rounded-lg space-y-4 ${className}`}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5, className = "" }: { cols?: number; className?: string }) {
  return (
    <tr className={`border-b border-asas-silver/10 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export { Skeleton }
