'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type Notification = {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

type NotificationContextValue = {
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
      timeouts.clear()
    }
  }, [])

  const addNotification = useMemo(
    () => (n: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).slice(2)
      setNotifications((prev) => [...prev, { ...n, id }])

      const timeout = setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== id))
        timeoutsRef.current.delete(id)
      }, 4000)

      timeoutsRef.current.set(id, timeout)
    },
    []
  )

  const removeNotification = useMemo(
    () => (id: string) => {
      const timeout = timeoutsRef.current.get(id)
      if (timeout) clearTimeout(timeout)
      timeoutsRef.current.delete(id)
      setNotifications((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, addNotification, removeNotification }),
    [notifications, addNotification, removeNotification]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export type { NotificationContextValue }
