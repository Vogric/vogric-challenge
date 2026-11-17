import Link from 'next/link'
import { ArrowLeft, LockKeyhole } from 'lucide-react'

/**
 * Brand column of the sign-in screen. It has no interactivity, so it stays a
 * Server Component and ships no JavaScript. Extracted from `login-form.tsx` to
 * keep every module under the 150-line source budget.
 */
export function LoginBrandPanel() {
  return (
    <section className="relative flex flex-col justify-between bg-sidebar px-6 py-7 text-sidebar-foreground sm:px-10 lg:px-14 lg:py-12">
      <div>
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            V
          </span>
          <span className="font-semibold tracking-tight">Vogric Ops</span>
        </Link>

        <div className="mt-16 max-w-md lg:mt-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
            Editorial Ops / secure access
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
            Welcome back to the control room.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-sidebar-muted">
            Sign in to the Acme Corp workspace. Roles, tenant scope and session
            revocation are resolved server-side.
          </p>

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
              Use the demo account to explore all three tenant roles.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border pt-4 text-[10px] uppercase tracking-[0.12em] text-sidebar-muted">
        <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-sidebar-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to overview
        </Link>
        <span className="inline-flex items-center gap-1.5">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          HttpOnly · revocable
        </span>
      </div>
    </section>
  )
}
