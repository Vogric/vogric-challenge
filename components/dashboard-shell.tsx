'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6">
          <nav className="mb-6 flex items-center space-x-1 text-sm text-muted-foreground">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Dashboard
            </Link>
            <span className="px-3 py-1.5">/</span>
            <Link
              href="/dashboard/projects"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/dashboard/projects')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Projects
            </Link>
          </nav>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ type: 'spring' as const, stiffness: 320, damping: 30 }}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
