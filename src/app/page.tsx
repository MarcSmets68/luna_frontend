import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export default function Home() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
