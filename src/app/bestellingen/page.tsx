import { AppShell } from "@/components/layout/app-shell";
import { BestellingenPage } from "@/features/bestellingen/components/bestellingen-page";
import { getBestelorders } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Bestellingen({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getBestelorders({ page, pageSize: PAGE_SIZE });

  return (
    <AppShell>
      <BestellingenPage items={items} page={page} hasMore={hasMore} />
    </AppShell>
  );
}
