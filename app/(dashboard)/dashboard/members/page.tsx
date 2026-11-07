export const dynamic = 'force-dynamic';

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team Members</h1>
        <p className="text-muted-foreground text-sm">Manage team members and access.</p>
      </div>
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <p className="text-muted-foreground text-sm">No team members found.</p>
      </div>
    </div>
  );
}