export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings.</p>
      </div>
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <p className="text-muted-foreground text-sm">No settings available.</p>
      </div>
    </div>
  );
}