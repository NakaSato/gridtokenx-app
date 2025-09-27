import { toast as sonnerToast } from 'sonner'

export function useToast() {
  return {
    toast: sonnerToast,
    success: sonnerToast.success,
    error: sonnerToast.error,
    info: sonnerToast.info,
    warning: sonnerToast.warning,
  }
}