import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastContextValue = {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
})

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('')

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage)
    window.setTimeout(() => setMessage(''), 1600)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? <div className="toast">{message}</div> : null}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
