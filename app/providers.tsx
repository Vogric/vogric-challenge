'use client'

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <OrganizationProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </OrganizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
