'use client'

import { Bell, Sun, Moon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    queryClient.setQueryData(['currentUser'], null)
    router.push('/auth/login')
    router.refresh()
  }, [queryClient, router])

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-background bg-background/80 px-6 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {resolvedTheme === 'dark' ? (
          <Sun
            className="h-4 w-4 cursor-pointer transition-colors hover:text-primary"
            onClick={() => setTheme('light')}
          />
        ) : (
          <Moon
            className="h-4 w-4 cursor-pointer transition-colors hover:text-primary"
            onClick={() => setTheme('dark')}
          />
        )}
        <Bell className="h-5 w-5 cursor-pointer transition-colors hover:text-primary" aria-label="Notifications" />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-sm md:flex">
          <span className="text-muted-foreground">{user?.email ?? 'Guest'}</span>
          <button onClick={handleLogout} className="text-xs text-destructive hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
