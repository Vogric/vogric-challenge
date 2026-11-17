export type SettingsUser = {
  email: string
  name?: string | null
}

export type SettingsOrganization = {
  name: string
  slug: string
}

export type SettingsRole = 'ADMIN' | 'MANAGER' | 'VIEWER'
