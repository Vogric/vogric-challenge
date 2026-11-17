import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { initials } from '@/lib/initials'

type Activity = {
  id: string
  action: string
  entityType: string
  createdAt: Date
  actor: { name: string | null; email: string }
}

const ACTION_LABELS: Record<string, string> = {
  'task.status_changed': 'Task status changed',
  'membership.role_changed': 'Member role changed',
  'organization.selected': 'Organization selected',
}

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest tenant-scoped changes.</CardDescription>
        </div>
        <Link href="/dashboard/audit" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="View audit log">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="space-y-4" data-visual-mask="activity-list">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                  {initials(item.actor.name, item.actor.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {ACTION_LABELS[item.action] ?? item.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.actor.name ?? item.actor.email} · {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
