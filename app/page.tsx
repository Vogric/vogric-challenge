export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Database, Gauge, ScrollText, ShieldCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[minmax(380px,0.78fr)_1.22fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-sidebar px-6 py-7 text-sidebar-foreground sm:px-10 lg:px-14 lg:py-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                V
              </span>
              <span className="font-semibold tracking-tight">Vogric Ops</span>
              <span className="ml-auto rounded-full border border-sidebar-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-sidebar-muted">
                Portfolio build
              </span>
            </div>

            <div className="mt-16 max-w-md lg:mt-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
                Editorial Ops / 2026
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                The control room for multi-tenant teams.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-sidebar-muted">
                Organizations, roles, task operations and an audit trail — built
                end-to-end with Next.js 15, React 19 and PostgreSQL.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/auth/login" className={buttonVariants({ size: 'lg' })}>
                  Open the demo
                  <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#inside"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-sidebar-muted transition-colors hover:text-sidebar-foreground"
                >
                  See what is inside
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              <div className="mt-10 rounded-xl border border-sidebar-border bg-white/[0.04] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                  Demo access
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
                  <span>demo@example.com</span>
                  <span className="text-sidebar-muted">/</span>
                  <span>password123</span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-sidebar-muted">
                  Acme Corp is ADMIN · Globex is MANAGER · Initech is VIEWER.
                </p>
              </div>
            </div>
          </div>

          <footer className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sidebar-border pt-4 text-[10px] uppercase tracking-[0.12em] text-sidebar-muted">
            <span>Next.js 15</span>
            <span aria-hidden="true">·</span>
            <span>React 19</span>
            <span aria-hidden="true">·</span>
            <span>PostgreSQL</span>
          </footer>
        </section>

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
      </div>
      <InsideSection />
    </main>
  )
}


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

function InsideSection() {
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
