import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type TeamMember = {
  id: string
  role: string
  user: { name: string | null; email: string }
}

const ROLE_VARIANT: Record<string, 'primary' | 'neutral' | 'outline'> = {
  ADMIN: 'primary',
  MANAGER: 'neutral',
  VIEWER: 'outline',
}

function initials(member: TeamMember): string {
  return (member.user.name?.slice(0, 2) ?? member.user.email.slice(0, 2)).toUpperCase()
}

export function TeamOverview({ members }: { members: TeamMember[] }) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Team</CardTitle>
          <CardDescription>People in this workspace.</CardDescription>
        </div>
        <Link href="/dashboard/members" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Manage team">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="space-y-4">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  {initials(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.user.name ?? 'Unnamed user'}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                </div>
                <Badge variant={ROLE_VARIANT[member.role] ?? 'neutral'}>{member.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
