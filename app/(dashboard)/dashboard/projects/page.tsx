export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUserFromServer } from '@/lib/auth'
import { getActiveMembership } from '@/lib/organizations'
import { TaskListClient } from '@/components/projects/TaskListClient'

export default async function ProjectsPage() {
  const user = await getCurrentUserFromServer()
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Organization: {membership.organization.name}
        </p>
      </div>
      <TaskListClient orgId={membership.organization.id} />
    </div>
  )
}
