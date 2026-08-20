import { AppShell } from "@/components/layout/app-shell";
import { KlantenPage } from "@/features/klanten/components/klanten-page";
import { getKlanten } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Klanten({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; naam?: string }>;
}) {
  const { page: pageParam, naam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getKlanten({ naam, page, pageSize: PAGE_SIZE });

  return (
    <AppShell>
      <KlantenPage items={items} page={page} hasMore={hasMore} naam={naam ?? ""} />
    </AppShell>
  );
}
