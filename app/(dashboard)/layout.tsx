import { DashboardShell } from '@/components/dashboard-shell'
import { WorkspaceTransitionProvider } from '@/contexts/WorkspaceTransitionContext'
import { getCurrentUserFromServer } from '@/lib/auth'
import { getActiveMembership, getUserMemberships } from '@/lib/organizations'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserFromServer()
  const memberships = user ? await getUserMemberships(user.id) : []
  const activeMembership = user ? await getActiveMembership(user.id) : null

  return (
    <WorkspaceTransitionProvider>
      <DashboardShell
        memberships={memberships}
        activeOrganizationId={activeMembership?.organizationId ?? null}
      >
        {children}
      </DashboardShell>
    </WorkspaceTransitionProvider>
  )
}
