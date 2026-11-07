'use client'

import { Bell, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface NavbarProps {
  user: { name?: string | null; email?: string | null } | null | undefined
}

export function Navbar({ user }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }, [router])

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-background bg-background/80 backdrop-blur px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" onClick={() => setTheme('light')} />
        ) : (
          <Moon className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" onClick={() => setTheme('dark')} />
        )}
        <Bell
          className="h-5 w-5 cursor-pointer hover:text-primary transition-colors"
          aria-label="Notifications"
        />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{user?.email ?? 'Guest'}</span>
          <button onClick={handleLogout} className="text-xs text-destructive hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
