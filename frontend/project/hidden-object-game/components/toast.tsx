import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type ToastContextValue = {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
})

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('')
  const timeoutRef = useRef<number | null>(null)

  const clearToastTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const showToast = useCallback((nextMessage: string) => {
    clearToastTimeout()
    setMessage(nextMessage)
    timeoutRef.current = window.setTimeout(() => {
      setMessage('')
      timeoutRef.current = null
    }, 1600)
  }, [clearToastTimeout])

  useEffect(() => clearToastTimeout, [clearToastTimeout])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? <div className="toast">{message}</div> : null}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
