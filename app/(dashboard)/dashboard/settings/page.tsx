import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Building2, KeyRound, Lock, ScrollText, ShieldCheck, UserRound } from 'lucide-react'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const ROLE_VARIANT: Record<string, 'primary' | 'warning' | 'neutral'> = {
  ADMIN: 'primary',
  MANAGER: 'warning',
  VIEWER: 'neutral',
}

function initials(name: string | null, email: string): string {
  return (name?.slice(0, 2) ?? email.slice(0, 2)).toUpperCase()
}

export default async function SettingsPage() {
  const user = await getRequestUser()
  if (!user) redirect('/auth/login')

  const activeMembership = await getActiveMembership(user.id)
  if (!activeMembership) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-lg font-semibold">No organization assigned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask an administrator to add you to an organization.
        </p>
      </div>
    )
  }

  const isAdmin = activeMembership.role === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account, workspace, and access posture.
          </p>
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Read-only view
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <CardTitle className="text-base">Account</CardTitle>
            </div>
            <CardDescription>Your identity and active session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initials(user.name, user.email)}
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight">{user.name ?? 'Unnamed user'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Authentication
                </dt>
                <dd className="mt-1 text-sm font-medium">Email + password</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Session
                </dt>
                <dd className="mt-1 text-sm font-medium">HttpOnly cookie</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Lifetime
                </dt>
                <dd className="mt-1 text-sm font-medium">7 days</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <CardTitle className="text-base">Workspace</CardTitle>
            </div>
            <CardDescription>Current tenant and your access level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Organization
              </p>
              <p className="mt-1 text-base font-semibold">{activeMembership.organization.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Slug
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {activeMembership.organization.slug}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Role
              </p>
              <div className="mt-1">
                <Badge variant={ROLE_VARIANT[activeMembership.role] ?? 'neutral'}>
                  {activeMembership.role}
                </Badge>
              </div>
            </div>
            <Link
              href="/dashboard/members"
              className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
            >
              View team members
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
}
