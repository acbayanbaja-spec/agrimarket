import React, { createContext, useCallback, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, X } from 'lucide-react'

type Toast = {
  id: number
  message: string
  href?: string
  hrefLabel?: string
}

type ToastContextType = {
  toast: (message: string, href?: string, hrefLabel?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, href?: string, hrefLabel = 'View cart') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, message, href, hrefLabel }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-20 left-1/2 z-[80] flex w-[min(92vw,400px)] -translate-x-1/2 flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-soil-900 text-white px-4 py-3 shadow-soft animate-toast-in"
          >
            <CheckCircle2 className="h-5 w-5 text-primary-400 shrink-0" />
            <p className="flex-1 text-sm font-semibold">{item.message}</p>
            {item.href && (
              <Link to={item.href} className="text-xs font-bold text-secondary-300 whitespace-nowrap">
                {item.hrefLabel}
              </Link>
            )}
            <button
              type="button"
              className="text-white/70 hover:text-white"
              onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
