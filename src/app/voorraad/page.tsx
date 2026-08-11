import { AppShell } from "@/components/layout/app-shell";
import { VoorraadPage } from "@/features/voorraad/components/voorraad-page";
import { getArtikelen } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Voorraad({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getArtikelen(page, PAGE_SIZE);

  return (
    <AppShell>
      <VoorraadPage items={items} page={page} hasMore={hasMore} />
    </AppShell>
  );
}
