import * as React from "react"
import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
  variant?: "default" | "minimal"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({
  message = "Chargement...",
  variant = "default",
  size = "md",
  className = "",
}: LoadingStateProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center gap-2 py-8 ${className}`}>
        <Loader2 className={`${sizeMap[size]} animate-spin text-asas-gold`} />
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 px-6 ${className}`}>
      <div className="rounded-full bg-white/5 p-4">
        <Loader2 className={`${sizeMap[size]} animate-spin text-asas-gold`} />
      </div>
      {message && <p className="text-sm text-asas-silver">{message}</p>}
    </div>
  )
}
