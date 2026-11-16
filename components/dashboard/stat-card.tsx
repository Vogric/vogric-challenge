export type StatCardProps = {
  title: string
  value: string | number
  description: string
  valueTestId: string
  accent?: 'primary' | 'destructive' | 'secondary' | 'success'
}

const numberFormatter = new Intl.NumberFormat('en-US')

function formatValue(value: string | number): string {
  return typeof value === 'number' ? numberFormatter.format(value) : value
}

const ACCENT_DOTS: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary',
  destructive: 'bg-red-500',
  secondary: 'bg-foreground/40',
  success: 'bg-emerald-500',
}

export function StatCard({
  title,
  value,
  description,
  valueTestId,
  accent = 'primary',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        <span className={`h-2 w-2 rounded-full ${ACCENT_DOTS[accent]}`} aria-hidden="true" />
      </div>
      <p
        data-testid={valueTestId}
        className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground"
      >
        {formatValue(value)}
      </p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}
