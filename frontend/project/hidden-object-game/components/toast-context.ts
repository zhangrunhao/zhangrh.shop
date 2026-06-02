import { createContext, useContext } from 'react'

type ToastContextValue = {
  showToast: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
})

export const useToast = () => useContext(ToastContext)
