import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = {
  success: { icon: 'check_circle', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/8' },
  error:   { icon: 'error',        color: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/8' },
  info:    { icon: 'info',         color: 'text-blue-400',    border: 'border-blue-500/20',    bg: 'bg-blue-500/8' },
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const style = ICONS[toast.type] || ICONS.success

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  return (
    <div
      className={`
        flex items-center gap-3 pl-4 pr-3 py-3 min-w-[260px] max-w-xs
        rounded-xl border ${style.border} ${style.bg}
        bg-white dark:bg-[#1e2a36]
        shadow-xl shadow-black/15 dark:shadow-black/40
        transition-all duration-200 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <span
        className={`material-symbols-outlined text-[20px] flex-shrink-0 ${style.color}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {style.icon}
      </span>
      <p className="text-sm font-medium text-slate-900 dark:text-white flex-1">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 self-center w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] leading-none">close</span>
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
