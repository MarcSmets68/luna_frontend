import { unstable_rethrow } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ApiErrorMessage } from "@/components/error/api-error-message";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboard } from "@/lib/api-client";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  let dashboard;
  
  try {
    dashboard = await getDashboard();
  } catch (error) {
    unstable_rethrow(error);
    return <ApiErrorMessage error={error} pageName="het dashboard" />;
  }

  return (
    <AppShell>
      <DashboardPage dashboard={dashboard} />
    </AppShell>
  );
}
