import { AppShell } from "@/components/layout/app-shell";
import { VoorraadPage } from "@/features/voorraad/components/voorraad-page";
import { getArtikelen } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Voorraad({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; lageVoorraad?: string; toonGeblokkeerd?: string }>;
}) {
  const {
    page: pageParam,
    lageVoorraad: lageVoorraadParam,
    toonGeblokkeerd: toonGeblokkeerdParam,
  } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const lageVoorraad = lageVoorraadParam === "true";
  const toonGeblokkeerd = toonGeblokkeerdParam === "true";
  const { items, hasMore } = await getArtikelen(page, PAGE_SIZE, {
    lageVoorraad,
    geblokkeerd: toonGeblokkeerd ? undefined : false,
  });

  return (
    <AppShell>
      <VoorraadPage
        items={items}
        page={page}
        hasMore={hasMore}
        lageVoorraad={lageVoorraad}
        toonGeblokkeerd={toonGeblokkeerd}
      />
    </AppShell>
  );
}
