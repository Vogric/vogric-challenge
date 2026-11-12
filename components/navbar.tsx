'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useLogout'

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const logout = useLogout()
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-background bg-background/80 px-6 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={`Switch to ${nextTheme} theme`}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-sm md:flex">
          <span className="text-muted-foreground">{user?.email ?? 'Guest'}</span>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
