import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (
      message: string,
      options?: Partial<Omit<Toast, 'id' | 'message'>>
    ) => {
      const id = Math.random().toString(36).substr(2, 9)
      const toast: Toast = {
        id,
        type: 'info',
        message,
        duration: 4000,
        ...options,
      }

      setToasts((prev) => [...prev, toast])

      // Auto remove after duration
      if (toast.duration) {
        setTimeout(() => {
          removeToast(id)
        }, toast.duration)
      }

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (message: string, title?: string) => {
      return addToast(message, { type: 'success', title })
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, title?: string) => {
      return addToast(message, { type: 'error', title, duration: 5000 })
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, title?: string) => {
      return addToast(message, { type: 'warning', title })
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, title?: string) => {
      return addToast(message, { type: 'info', title })
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
