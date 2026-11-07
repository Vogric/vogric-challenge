export const dynamic = 'force-dynamic';

import { db } from '@/lib/db'
import { TaskListClient } from '@/components/projects/TaskListClient'

export default async function ProjectsPage() {
  const org = await db.organization.findFirst({
    where: { slug: 'acme-corp' },
    select: { id: true, name: true },
  })

  const orgId = org?.id ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-muted-foreground text-sm">
          Organization: {org?.name ?? 'Acme Corp'}
        </p>
      </div>
      {orgId ? <TaskListClient orgId={orgId} /> : null}
    </div>
  )
}