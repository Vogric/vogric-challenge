'use client'

import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

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

  const addNotification = useMemo(() => (n: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setNotifications((prev) => [...prev, { ...n, id }])
    setTimeout(() => setNotifications((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeNotification = useMemo(() => (id: string) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, addNotification, removeNotification }),
    [notifications]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export type { NotificationContextValue }
