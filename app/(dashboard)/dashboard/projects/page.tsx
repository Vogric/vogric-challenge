import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { getTasksPage } from '@/lib/tasks'
import { taskKeys } from '@/lib/query-keys'
import { TASK_PAGE_SIZE } from '@/types/tasks'
import { TaskListClient } from '@/components/projects/TaskListClient'
import { TaskTableSkeleton } from '@/components/projects/TaskTableSkeleton'

export const dynamic = 'force-dynamic'

/**
 * The prefetch used to block the whole route: the page could not render its
 * heading until the first page of tasks came back from Postgres. Hoisting it
 * into a child wrapped in <Suspense> lets the shell stream immediately and the
 * table fill in when the query resolves.
 */
async function TasksSection({ organizationId }: { organizationId: string }) {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: taskKeys.cursor(organizationId, null),
    queryFn: () => getTasksPage(organizationId, null, TASK_PAGE_SIZE),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskListClient key={organizationId} orgId={organizationId} />
    </HydrationBoundary>
  )
}

export default async function ProjectsPage() {
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

  const organizationId = membership.organization.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Organization: {membership.organization.name}
        </p>
      </div>
      <Suspense fallback={<TaskTableSkeleton rows={10} />}>
        <TasksSection organizationId={organizationId} />
      </Suspense>
    </div>
  )
}
