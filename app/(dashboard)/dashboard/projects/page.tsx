export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getCurrentUserFromServer } from '@/lib/auth'
import { getActiveMembership } from '@/lib/organizations'
import { getTasksCursorPage } from '@/lib/tasks'
import { taskKeys } from '@/lib/query-keys'
import { TASK_PAGE_SIZE } from '@/types/tasks'
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

  const organizationId = membership.organization.id
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: taskKeys.cursor(organizationId, null, 1),
    queryFn: () => getTasksCursorPage(organizationId, null, 1, TASK_PAGE_SIZE),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Organization: {membership.organization.name}
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskListClient key={organizationId} orgId={organizationId} />
      </HydrationBoundary>
    </div>
  )
}
