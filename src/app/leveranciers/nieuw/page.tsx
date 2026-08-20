import { AppShell } from "@/components/layout/app-shell";
import { LeverancierCreatePage } from "@/features/leveranciers/components/leverancier-create-page";

export default function LeverancierNieuw() {
  return (
    <AppShell>
      <LeverancierCreatePage />
    </AppShell>
  );
}
