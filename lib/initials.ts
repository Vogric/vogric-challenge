export function initials(name?: string | null, email?: string | null): string {
  return (name?.trim() || email?.trim() || 'U').slice(0, 2).toUpperCase()
}
