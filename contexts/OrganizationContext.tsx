'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { Organization, Membership, Role } from '@/types'

type OrganizationContextValue = {
  activeOrganization: Organization | null
  memberships: Membership[]
  setActiveOrganization: (org: Organization | null) => void
  userRole: Role | null
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])

  const userRole = useMemo(() => {
    if (!activeOrganization) return null
    const m = memberships.find((m) => m.organizationId === activeOrganization.id)
    return m ? m.role : null
  }, [activeOrganization, memberships])

  const value = useMemo<OrganizationContextValue>(
    () => ({ activeOrganization, memberships, setActiveOrganization, userRole }),
    [activeOrganization, memberships, userRole]
  )

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) throw new Error('useOrganization debe usarse dentro de OrganizationProvider')
  return context
}

export type { OrganizationContextValue }
