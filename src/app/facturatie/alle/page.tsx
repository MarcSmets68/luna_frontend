import { AppShell } from "@/components/layout/app-shell";
import { FacturenPage } from "@/features/facturatie/components/facturen-page";
import { getFacturen } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function FacturatieAlle({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getFacturen({ page, pageSize: PAGE_SIZE });

  return (
    <AppShell>
      <FacturenPage items={items} page={page} hasMore={hasMore} />
    </AppShell>
  );
}
