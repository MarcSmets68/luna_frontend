import { AppShell } from "@/components/layout/app-shell";
import { LakproductiePage } from "@/features/lakproductie/components/lakproductie-page";
import { getLakproductieItems } from "@/lib/api-client";

export default async function Lakproduktie() {
  const items = await getLakproductieItems();

  return (
    <AppShell>
      <LakproductiePage items={items} />
    </AppShell>
  );
}
