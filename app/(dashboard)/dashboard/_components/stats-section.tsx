import { getOrganizationStats } from './dashboard-stats'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import type { StatCardProps } from '@/components/dashboard/stat-card'

export async function StatsSection({
  organizationId,
  organizationName,
}: {
  organizationId: string
  organizationName: string
}) {
  const stats = await getOrganizationStats(organizationId)

  const cards: StatCardProps[] = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      description: `Projects in ${organizationName}.`,
      valueTestId: 'stat-projects',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      description: 'Tasks not yet completed.',
      valueTestId: 'stat-pending',
      accent: 'destructive',
    },
    {
      title: 'Users',
      value: stats.members,
      description: 'Members in the current organization.',
      valueTestId: 'stat-members',
      accent: 'secondary',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      description: 'Tasks marked as done.',
      valueTestId: 'stat-completed',
      accent: 'success',
    },
  ]

  return <StatsGrid stats={cards} />
}
