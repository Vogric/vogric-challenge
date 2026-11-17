import { UserRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SettingsUser } from './settings-types'
import { initials } from '@/lib/initials'

export function SettingsAccountCard({ user }: { user: SettingsUser }) {
  return (
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
  )
}
