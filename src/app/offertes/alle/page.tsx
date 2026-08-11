import { AppShell } from "@/components/layout/app-shell";
import { OffertesPage } from "@/features/offertes/components/offertes-page";
import { getOffertes } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function OffertesAlle({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getOffertes({ page, pageSize: PAGE_SIZE });

  return (
    <AppShell>
      <OffertesPage items={items} page={page} hasMore={hasMore} />
    </AppShell>
  );
}
