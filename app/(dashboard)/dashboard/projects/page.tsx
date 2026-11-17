import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { getTasksPage } from '@/lib/tasks/get-tasks-page'
import { db } from '@/lib/db'
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
async function TasksSection({
  organizationId,
  projects,
}: {
  organizationId: string
  projects: Array<{ id: string; name: string }>
}) {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: taskKeys.cursor(organizationId, null),
    queryFn: () => getTasksPage(organizationId, null, TASK_PAGE_SIZE),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskListClient key={organizationId} orgId={organizationId} projects={projects} />
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

  const projects = await db.project.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every task across the workspace, newest first.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {membership.organization.name}
        </p>
      </div>
      <Suspense fallback={<TaskTableSkeleton rows={10} />}>
        <TasksSection organizationId={organizationId} projects={projects} />
      </Suspense>
    </div>
  )
}
