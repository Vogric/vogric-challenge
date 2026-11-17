import Link from 'next/link'
import { ArrowRight, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SettingsOrganization, SettingsRole } from './settings-types'

const ROLE_VARIANT: Record<SettingsRole, 'primary' | 'warning' | 'neutral'> = {
  ADMIN: 'primary',
  MANAGER: 'warning',
  VIEWER: 'neutral',
}

export function SettingsWorkspaceCard({
  organization,
  role,
}: {
  organization: SettingsOrganization
  role: SettingsRole
}) {
  return (
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
          <p className="mt-1 text-base font-semibold">{organization.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Slug
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{organization.slug}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Role
          </p>
          <div className="mt-1">
            <Badge variant={ROLE_VARIANT[role]}>{role}</Badge>
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
  )
}
