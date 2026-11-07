export const dynamic = 'force-dynamic';

export default function DashboardHomePage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Active Projects</h2>
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">12</span>
        </div>
        <p className="text-muted-foreground text-sm">Active projects this month.</p>
      </div>
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Pending Tasks</h2>
          <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">24</span>
        </div>
        <p className="text-muted-foreground text-sm">Assigned tasks not yet completed.</p>
      </div>
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Users</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">8</span>
        </div>
        <p className="text-muted-foreground text-sm">Members in current organization.</p>
      </div>
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Uptime</h2>
          <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs text-green-100">99.8%</span>
        </div>
        <p className="text-muted-foreground text-sm">Average system availability.</p>
      </div>
    </div>
  )
}