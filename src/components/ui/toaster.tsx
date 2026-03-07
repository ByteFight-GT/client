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
            <div className="flex flex-col gap-1 w-full">
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
