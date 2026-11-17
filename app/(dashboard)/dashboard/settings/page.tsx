import { redirect } from 'next/navigation'
import { getRequestUser } from '@/lib/request-user'
import { getActiveMembership } from '@/lib/organizations'
import { SettingsContent } from './_components/settings-content'

export const dynamic = 'force-dynamic'

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

  return (
    <SettingsContent
      user={user}
      organization={activeMembership.organization}
      role={activeMembership.role}
    />
  )
}
