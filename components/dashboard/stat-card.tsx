export type StatCardProps = {
  title: string
  value: string | number
  description: string
  valueTestId: string
  accent?: 'primary' | 'destructive' | 'secondary' | 'success'
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-700 text-white',
}

export function StatCard({
  title,
  value,
  description,
  valueTestId,
  accent = 'primary',
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span
          data-testid={valueTestId}
          className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${ACCENT_CLASSES[accent]}`}
        >
          {value}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
