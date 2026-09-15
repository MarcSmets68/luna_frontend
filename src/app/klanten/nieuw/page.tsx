import { AppShell } from "@/components/layout/app-shell";
import { KlantCreatePage } from "@/features/klanten/components/klant-create-page";

export default function KlantNieuw() {
  return (
    <AppShell>
      <KlantCreatePage />
    </AppShell>
  );
}
