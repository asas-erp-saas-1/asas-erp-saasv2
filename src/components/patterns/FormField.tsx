import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, required, hint, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-2 flex flex-col", className)}
      {...props}
    >
      {label && (
        <label className="text-sm font-semibold text-asas-sand">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-asas-silver">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-rose-500">{error}</p>
      )}
    </div>
  )
)
FormField.displayName = "FormField"

export { FormField }
