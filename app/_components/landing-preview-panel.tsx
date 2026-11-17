import Image from 'next/image'
import { Database, Gauge, ScrollText, ShieldCheck } from 'lucide-react'

const proof = [
  {
    icon: ShieldCheck,
    title: 'Tenant-safe by construction',
    description: 'Membership is derived from the resource, not the request body.',
  },
  {
    icon: ScrollText,
    title: 'Operational audit trail',
    description: 'Status and role changes are recorded with actor context.',
  },
  {
    icon: Gauge,
    title: 'Performance budgeted',
    description: 'Per-route JS, LCP and CLS checks run in CI.',
  },
]

/**
 * Right column of the landing page: the product screenshot, the three proof
 * points and the deployment meta row. Extracted from `app/page.tsx` to keep the
 * route file under the page-size budget; markup and classes are unchanged.
 */
export function LandingPreviewPanel() {
  return (
    <section className="relative flex min-h-0 flex-col justify-center border-t border-border bg-background p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Live product preview
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
            Acme Corp · ADMIN
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_70px_-32px_rgba(16,24,40,0.35)]">
          <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/50 px-3">
            <span className="h-2 w-2 rounded-full bg-[#e6b8ae]" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-[#e8d6a6]" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-[#b9d6bd]" aria-hidden="true" />
            <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">
              vogric-challenge.vercel.app/dashboard
            </span>
          </div>
          <Image
            src="/dashboard-preview.png"
            alt="Vogric Ops dashboard showing multi-tenant KPIs, task distribution and recent activity"
            width={1440}
            height={900}
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="h-auto w-full"
          />
        </div>

        <div id="proof" className="mt-5 grid gap-3 sm:grid-cols-3">
          {proof.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-3.5">
              <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              <p className="mt-2 text-xs font-semibold">{item.title}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            Neon PostgreSQL · eu-central-1
          </span>
          <span>Live deployment · fra1</span>
        </div>
      </div>
    </section>
  )
}
