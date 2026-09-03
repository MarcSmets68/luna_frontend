import { AppShell } from "@/components/layout/app-shell";
import { RequireSessionBoundary } from "@/features/auth/components/require-session-boundary";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboard } from "@/lib/api-client";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  let dashboard;
  
  try {
    dashboard = await getDashboard();
  } catch (error) {
    // API not reachable (e.g., localhost in production) - show error message
    return (
      <AppShell>
        <div className="p-8 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">API Niet Bereikbaar</h1>
          <p className="text-gray-700 mb-4">
            De backend API is momenteel niet bereikbaar. Dit kan gebeuren wanneer:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>De PASOE server is niet publiek beschikbaar</li>
            <li>De API_BASE_URL environment variable is niet correct geconfigureerd</li>
            <li>De backend server is offline</li>
          </ul>
          <p className="text-sm text-gray-500">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RequireSessionBoundary>
        <DashboardPage dashboard={dashboard} />
      </RequireSessionBoundary>
    </AppShell>
  );
}
