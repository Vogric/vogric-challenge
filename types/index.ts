export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER'

export type Organization = {
  id: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

export type Membership = {
  id: string
  userId: string
  organizationId: string
  role: Role
  createdAt: Date
}
