import Link from 'next/link'
import { ArrowRight, KeyRound, Lock, ScrollText, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsSecurityCard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <CardTitle className="text-base">Security posture</CardTitle>
        </div>
        <CardDescription>
          Controls applied to every dashboard request in this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">Revocable sessions</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sessions are validated against the database on every request.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">Role-based access</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Admin, manager, and viewer capabilities are enforced server-side.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <ScrollText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">Audit trail</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Task and membership changes are recorded with actor context.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">Tenant isolation</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Every query is scoped to the active organization membership.
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/audit"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Open audit log
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
