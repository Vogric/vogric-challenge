'use client'

import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

type AuthContextValue = {
  user: { id: string; email: string; name?: string | null } | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchCurrentUser() {
  const res = await fetch('/api/auth/me', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.user ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
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
