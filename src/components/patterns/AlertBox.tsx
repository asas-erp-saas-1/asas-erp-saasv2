import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 flex gap-3 animate-in",
  {
    variants: {
      variant: {
        default: "border-asas-silver/30 bg-white/5 text-asas-sand",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        error:
          "border-rose-500/30 bg-rose-500/10 text-rose-400",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface AlertBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  description?: string
  onClose?: () => void
  closeable?: boolean
  icon?: React.ReactNode
}

const AlertBox = React.forwardRef<HTMLDivElement, AlertBoxProps>(
  (
    {
      className,
      variant,
      title,
      description,
      onClose,
      closeable = true,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    if (!isVisible) return null

    const iconMap = {
      default: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: AlertCircle,
      info: Info,
    }

    const IconComponent = icon || iconMap[variant!]

    return (
      <div
        ref={ref}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {IconComponent && (
          <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
          {children && !description && (
            <div className="text-sm">{children}</div>
          )}
        </div>
        {closeable && (
          <button
            onClick={() => {
              setIsVisible(false)
              onClose?.()
            }}
            className="ml-auto flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
AlertBox.displayName = "AlertBox"

export { AlertBox, alertVariants }
