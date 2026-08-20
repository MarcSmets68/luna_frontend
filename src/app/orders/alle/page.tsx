import { AppShell } from "@/components/layout/app-shell";
import { OrdersPage } from "@/features/orders/components/orders-page";
import { getBonnen } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function OrdersAlle({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; bonnr?: string; naam?: string }>;
}) {
  const { page: pageParam, bonnr, naam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getBonnen({ page, pageSize: PAGE_SIZE, bonnr, naam });

  return (
    <AppShell>
      <OrdersPage items={items} page={page} hasMore={hasMore} bonnr={bonnr ?? ""} naam={naam ?? ""} />
    </AppShell>
  );
}
