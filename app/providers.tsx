'use client'

import React from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { NotificationViewport } from '@/components/notification-viewport'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => makeQueryClient())

  return (
    <LazyMotion features={domAnimation} strict>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              {children}
              <NotificationViewport />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </LazyMotion>
  )
}
