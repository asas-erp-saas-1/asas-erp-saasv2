import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border px-3 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-asas-silver/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asas-gold focus-visible:ring-offset-2 focus-visible:ring-offset-asas-charcoal disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-asas-silver/20 bg-white/5 text-asas-sand hover:border-asas-silver/30 active:bg-white/10",
        outline:
          "border-asas-silver/30 bg-transparent text-asas-sand hover:border-asas-silver/50",
        filled:
          "border-transparent bg-white/10 text-asas-sand hover:bg-white/15",
      },
      size: {
        sm: "h-8 text-xs px-2.5",
        md: "h-10 text-sm px-3",
        lg: "h-12 text-base px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
