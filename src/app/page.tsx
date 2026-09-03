import { AppShell } from "@/components/layout/app-shell";
import { RequireSessionBoundary } from "@/features/auth/components/require-session-boundary";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboard } from "@/lib/api-client";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  const dashboard = await getDashboard();

  return (
    <AppShell>
      <RequireSessionBoundary>
        <DashboardPage dashboard={dashboard} />
      </RequireSessionBoundary>
    </AppShell>
  );
}
