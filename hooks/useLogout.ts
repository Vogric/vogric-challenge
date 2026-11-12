'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authKeys } from '@/lib/query-keys'

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const logout = useCallback(async () => {
    setIsPending(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      // Clear every cached query so the next session cannot read the previous
      // user's organization or task data.
      queryClient.clear()
      queryClient.setQueryData(authKeys.currentUser, null)
      router.push('/auth/login')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }, [queryClient, router])

  return { logout, isPending }
}
