'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    queryClient.setQueryData(['currentUser'], null)
    router.push('/auth/login')
    router.refresh()
  }, [queryClient, router])
}
