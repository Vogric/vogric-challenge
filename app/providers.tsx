'use client'

import { useState, type ReactNode } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query'
import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { NotificationViewport } from '@/components/notification-viewport'

/**
 * Global client providers. Auth is deliberately absent: it lives in the
 * dashboard layout, which is the only subtree that knows the user on the server
 * and can therefore hand the provider a hydrated value.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState<QueryClient>(() => makeQueryClient())

  return (
    <LazyMotion features={domAnimation} strict>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            {children}
            <NotificationViewport />
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </LazyMotion>
  )
}
