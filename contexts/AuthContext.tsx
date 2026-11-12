'use client'

import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authKeys } from '@/lib/query-keys'

type AuthContextValue = {
  user: { id: string; email: string; name?: string | null } | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type CurrentUserResponse = {
  user: AuthContextValue['user']
}

async function fetchCurrentUser(): Promise<AuthContextValue['user']> {
  const res = await fetch('/api/auth/me', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) return null
  const data = (await res.json()) as CurrentUserResponse
  return data.user ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: authKeys.currentUser,
    queryFn: fetchCurrentUser,
    // Never serve a stale null from the login page after the cookie was set.
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
    }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export type { AuthContextValue }
