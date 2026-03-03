"use client"

import { useToast } from "@/hooks/useToast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, toastTitle, toastDescription, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {toastTitle && <ToastTitle>{toastTitle}</ToastTitle>}
              {toastDescription && (
                <ToastDescription>{toastDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
