import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboard } from "@/lib/api-client";

export default async function Home() {
  const dashboard = await getDashboard();

  return (
    <AppShell>
      <DashboardPage dashboard={dashboard} />
    </AppShell>
  );
}
