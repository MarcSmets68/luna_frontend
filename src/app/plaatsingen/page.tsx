import { AppShell } from "@/components/layout/app-shell";
import { PlaatsingenPage } from "@/features/plaatsingen/components/plaatsingen-page";
import { getMockPlaatsingen } from "@/features/plaatsingen/data/mock-plaatsingen";

const PAGE_SIZE = 25;

export default async function Plaatsingen({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; planr?: string; naam?: string }>;
}) {
  const { page: pageParam, planr, naam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getMockPlaatsingen({ page, pageSize: PAGE_SIZE, planr, naam });

  return (
    <AppShell>
      <PlaatsingenPage
        items={items}
        page={page}
        hasMore={hasMore}
        planr={planr ?? ""}
        naam={naam ?? ""}
      />
    </AppShell>
  );
}
