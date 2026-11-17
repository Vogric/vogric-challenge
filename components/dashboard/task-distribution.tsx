import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type StatusCount = {
  status: string
  count: number
}

const STATUS_ORDER = ['todo', 'in_progress', 'done'] as const

const STATUS_META: Record<(typeof STATUS_ORDER)[number], { label: string; color: string; dot: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-400', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500', dot: 'bg-amber-500' },
  done: { label: 'Done', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function TaskDistribution({ counts }: { counts: StatusCount[] }) {
  const normalized = STATUS_ORDER.map((status) => {
    const found = counts.find((item) => item.status === status)
    return { status, count: found?.count ?? 0 }
  })
  const total = normalized.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task distribution</CardTitle>
        <CardDescription>Current workload by status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {numberFormatter.format(total)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">tasks in this workspace</p>
        </div>

        {total > 0 ? (
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Task distribution: ${normalized.map((item) => `${STATUS_META[item.status].label} ${item.count}`).join(', ')}`}
          >
            {normalized.map((item) => {
              const meta = STATUS_META[item.status]
              const percentage = (item.count / total) * 100
              return (
                <span
                  key={item.status}
                  className={meta.color}
                  style={{ width: `${percentage}%` }}
                  title={`${meta.label}: ${item.count}`}
                />
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        )}

        <div className="space-y-2.5">
          {normalized.map((item) => {
            const meta = STATUS_META[item.status]
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
            return (
              <div key={item.status} className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">{meta.label}</span>
                <span className="font-medium tabular-nums">{numberFormatter.format(item.count)}</span>
                <span className="w-9 text-right text-xs text-muted-foreground">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
