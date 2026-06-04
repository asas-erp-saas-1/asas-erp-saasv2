import * as React from "react"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"

export interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
  isLoading?: boolean
  disabled?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmDialog({
  open = false,
  onOpenChange,
  title = "Confirm Action",
  description,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  disabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  const variantConfig = {
    default: {
      icon: "info",
      confirmButtonVariant: "default" as const,
    },
    destructive: {
      icon: "alert",
      confirmButtonVariant: "destructive" as const,
    },
    warning: {
      icon: "warning",
      confirmButtonVariant: "destructive" as const,
    },
  }

  const config = variantConfig[variant]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === "destructive" || variant === "warning" ? (
              <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
            ) : null}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {message && (
          <div className="py-4 text-sm text-asas-silver">
            {message}
          </div>
        )}

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading || disabled}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={disabled}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useConfirmDialog() {
  const [open, setOpen] = React.useState(false)
  const [config, setConfig] = React.useState<ConfirmDialogProps>({
    onConfirm: () => {},
  })

  const confirm = (options: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
    setConfig(options)
    setOpen(true)
  }

  return {
    open,
    setOpen,
    config: { ...config, open, onOpenChange: setOpen },
    confirm,
  }
}
