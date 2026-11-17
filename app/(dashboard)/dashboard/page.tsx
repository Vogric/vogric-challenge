import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { buttonVariants } from '@/components/ui/button'
import { DashboardSections } from './_components/dashboard-sections'
import { StatsSection } from './_components/stats-section'
import { SectionsFallback, StatsFallback } from './_components/fallbacks'

export const dynamic = 'force-dynamic'

export default async function DashboardHomePage() {
  const user = await getRequestUser()
  if (!user) redirect('/auth/login')

  const membership = await getActiveMembership(user.id)
  if (!membership) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">No organization assigned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask an administrator to add you to an organization.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {membership.organization.name} &middot; signed in as {membership.role.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/audit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View audit
          </Link>
          <Link href="/dashboard/projects" className={buttonVariants({ variant: 'default', size: 'sm' })}>
            Open projects
          </Link>
        </div>
      </div>

      <Suspense fallback={<StatsFallback />}>
        <StatsSection
          organizationId={membership.organization.id}
          organizationName={membership.organization.name}
        />
      </Suspense>

      <Suspense fallback={<SectionsFallback />}>
        <DashboardSections organizationId={membership.organization.id} />
      </Suspense>
    </div>
  )
}
