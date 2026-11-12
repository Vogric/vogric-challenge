'use client'

import { useNotifications, type Notification } from '@/hooks/useNotifications'

const TYPE_STYLES: Record<Notification['type'], string> = {
  success: 'border-green-600/30 bg-green-50 text-green-900',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-border bg-card text-foreground',
}

export function NotificationViewport() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-2"
      aria-live="polite"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role={notification.type === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-lg border p-3 text-sm shadow-lg ${TYPE_STYLES[notification.type]}`}
        >
          <p className="flex-1">{notification.message}</p>
          <button
            type="button"
            onClick={() => removeNotification(notification.id)}
            aria-label="Dismiss notification"
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
