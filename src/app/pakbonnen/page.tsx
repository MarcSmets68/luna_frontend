import { AppShell } from "@/components/layout/app-shell";
import { PakbonnenPage } from "@/features/pakbonnen/components/pakbonnen-page";
import { getPakbonnen } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Pakbonnen({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; paknr?: string; naam?: string; stempel?: string }>;
}) {
  const { page: pageParam, paknr, naam, stempel } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getPakbonnen({ page, pageSize: PAGE_SIZE, paknr, naam, stempel });

  return (
    <AppShell>
      <PakbonnenPage
        items={items}
        page={page}
        hasMore={hasMore}
        paknr={paknr ?? ""}
        naam={naam ?? ""}
        stempel={stempel ?? ""}
      />
    </AppShell>
  );
}
