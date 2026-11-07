'use client'

export const dynamic = 'force-dynamic';

import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={null} />
        <main className="flex-1 overflow-y-auto p-6">
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Dashboard
            </Link>
            <span className="px-3 py-1.5">/</span>
            <Link
              href="/dashboard/projects"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/dashboard/projects') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Proyectos
            </Link>
          </nav>
          {children}
        </main>
      </div>
    </div>
  )
}