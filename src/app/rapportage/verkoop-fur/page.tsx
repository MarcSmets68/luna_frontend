import { AppShell } from "@/components/layout/app-shell";
import { VerkoopFurPage } from "@/features/verkoop-fur/components/verkoop-fur-page";
import { getVerkoopFurOverzicht } from "@/lib/api-client";

export default async function VerkoopFur() {
  const { items, periodeVan, periodeTot } = await getVerkoopFurOverzicht();

  return (
    <AppShell>
      <VerkoopFurPage items={items} periodeVan={periodeVan} periodeTot={periodeTot} />
    </AppShell>
  );
}
