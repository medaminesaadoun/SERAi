import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()
let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x))
    // Remove from DOM after exit animation
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 320)
  }, [])

  const add = useCallback((message, type = 'info', duration = 4500) => {
    const id = ++_id
    setToasts(t => [...t, { id, message, type, leaving: false }])
    if (duration > 0) setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  const toast = {
    success: (msg, dur) => add(msg, 'success', dur),
    error:   (msg, dur) => add(msg, 'error',   dur),
    warning: (msg, dur) => add(msg, 'warning', dur),
    info:    (msg, dur) => add(msg, 'info',    dur),
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, remove }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
