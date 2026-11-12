export type OrganizationSummary = {
  id: string
  name: string
  slug: string
}

export type MembershipSummary = {
  organizationId: string
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  organization: OrganizationSummary
}
