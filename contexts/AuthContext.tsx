'use client'

import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authKeys } from '@/lib/query-keys'

type AuthUser = { id: string; email: string; name?: string | null }

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type CurrentUserResponse = {
  user: AuthUser | null
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) return null
  const data = (await res.json()) as CurrentUserResponse
  return data.user ?? null
}

/**
 * `initialUser` comes from the Server Component that already resolved the
 * session, so the provider never has to ask the network for a user the server
 * just handed it.
 *
 * Before: `staleTime: 0` + `refetchOnMount: 'always'` meant every dashboard load
 * fired `/api/auth/me` again and the navbar rendered "Guest" until it returned.
 * Now the query starts hydrated and merely revalidates in the background after
 * five minutes.
 */
export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
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
