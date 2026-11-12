export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="space-y-6 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">SaaS Dashboard</h1>
        <p className="text-muted-foreground">Senior React / Next.js technical demo</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Sign in to dashboard
        </Link>
      </div>
    </div>
  )
}
