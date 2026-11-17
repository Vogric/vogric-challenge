import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

const inside = [
  {
    index: '01',
    title: 'Tenant isolation',
    description:
      'The organization is derived from the resource, then checked against membership before any mutation.',
  },
  {
    index: '02',
    title: 'Cursor operations',
    description:
      'Keyset pagination keeps results stable while tasks change. Search, status and project filters share the same contract.',
  },
  {
    index: '03',
    title: 'Auditable changes',
    description:
      'Task status and role changes write an actor-scoped audit event in the same transaction.',
  },
  {
    index: '04',
    title: 'Delivery gates',
    description:
      'Strict TypeScript, axe, visual snapshots, cross-browser smoke and per-route performance budgets run in CI.',
  },
]

/**
 * "Inside the build" section, anchored by `#inside` from the hero. Extracted
 * from `app/page.tsx` to keep the route file under the page-size budget.
 */
export function LandingInsideSection() {
  return (
    <section id="inside" className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Inside the build
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            Product behavior, not screenshots.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The demo is backed by guarded mutations, a real audit trail and a
            delivery pipeline that fails when the quality bar slips.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {inside.map((item) => (
            <div key={item.index} className="rounded-xl border border-border bg-card p-4">
              <span className="font-mono text-[11px] text-primary">{item.index}</span>
              <h3 className="mt-5 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <Link href="/auth/login" className={buttonVariants({ size: 'lg' })}>
            Open the demo
            <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="text-xs text-muted-foreground">
            No setup. Read-only until you change a task.
          </span>
        </div>
      </div>
    </section>
  )
}
