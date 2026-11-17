import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/**
 * Left column of the landing page: brand, value proposition, demo credentials
 * and the stack footer. Extracted from `app/page.tsx` to keep the route file
 * under the page-size budget; markup and classes are unchanged.
 */
export function LandingHeroPanel() {
  return (
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
  )
}
