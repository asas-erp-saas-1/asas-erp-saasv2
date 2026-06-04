import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asas-gold focus-visible:ring-offset-2 focus-visible:ring-offset-asas-charcoal disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-asas-gold text-asas-charcoal shadow-md hover:bg-asas-gold/90 active:shadow-sm hover:shadow-lg",
        destructive:
          "bg-rose-500 text-white shadow-md hover:bg-rose-500/90 active:shadow-sm hover:shadow-lg",
        outline:
          "border border-asas-silver/30 bg-transparent text-asas-sand hover:bg-white/10 hover:border-asas-silver/50 active:bg-white/5",
        secondary:
          "bg-white/10 text-asas-sand hover:bg-white/20 active:bg-white/15",
        ghost: "hover:bg-white/5 hover:text-asas-sand text-asas-silver active:bg-white/10",
        link: "text-asas-gold underline-offset-4 hover:underline active:opacity-80",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-11 px-8 text-sm",
        xl: "h-12 px-10 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </div>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
