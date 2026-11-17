'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authKeys } from '@/lib/query-keys'
import { currentUserResponseSchema, type AuthUser } from '@/lib/validations/auth'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) return null
  return currentUserResponseSchema.parse(await res.json()).user
}

/**
 * `initialUser` is hydrated by the Server Component so the provider never asks
 * `/api/auth/me` for a user the server already resolved. Background
 * revalidation starts after five minutes.
 */
export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: AuthUser | null
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: authKeys.currentUser,
    queryFn: fetchCurrentUser,
    initialData: initialUser,
    staleTime: 1000 * 60 * 5,
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

export type { AuthContextValue, AuthUser }
