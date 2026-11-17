import { SettingsAccountCard } from './settings-account-card'
import { SettingsSecurityCard } from './settings-security-card'
import { SettingsWorkspaceCard } from './settings-workspace-card'
import type { SettingsOrganization, SettingsRole, SettingsUser } from './settings-types'

type SettingsContentProps = {
  user: SettingsUser
  organization: SettingsOrganization
  role: SettingsRole
}

export function SettingsContent({ user, organization, role }: SettingsContentProps) {
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
        <SettingsAccountCard user={user} />
        <SettingsWorkspaceCard organization={organization} role={role} />
        <SettingsSecurityCard isAdmin={role === 'ADMIN'} />
      </div>
    </div>
  )
}
