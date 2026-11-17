'use client'

import { OrganizationSwitcher } from '@/components/organizations/organization-switcher'
import type { MembershipSummary } from '@/types/organizations'

type MobileNavProps = {
  memberships: MembershipSummary[]
  activeOrganizationId: string | null
}

export function MobileNav({ memberships, activeOrganizationId }: MobileNavProps) {
  return (
    <div className="border-b border-border bg-background px-3 py-2.5 lg:hidden">
      <OrganizationSwitcher
        memberships={memberships}
        activeOrganizationId={activeOrganizationId}
        ariaLabel="Organization (mobile)"
      />
    </div>
  )
}
