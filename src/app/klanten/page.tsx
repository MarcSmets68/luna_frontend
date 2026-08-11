import { AppShell } from "@/components/layout/app-shell";
import { KlantenPage } from "@/features/klanten/components/klanten-page";
import { getKlanten } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Klanten({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getKlanten(page, PAGE_SIZE);

  return (
    <AppShell>
      <KlantenPage items={items} page={page} hasMore={hasMore} />
    </AppShell>
  );
}
