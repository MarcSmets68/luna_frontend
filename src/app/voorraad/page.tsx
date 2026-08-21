import { AppShell } from "@/components/layout/app-shell";
import { VoorraadPage } from "@/features/voorraad/components/voorraad-page";
import { getArtikelen, type OnderMinimumFilter } from "@/lib/api-client";

const PAGE_SIZE = 25;

const VALID_ONDER_MINIMUM: OnderMinimumFilter[] = ["intern", "extern", "beide"];

function parseOnderMinimum(value: string | undefined): OnderMinimumFilter | undefined {
  return VALID_ONDER_MINIMUM.includes(value as OnderMinimumFilter)
    ? (value as OnderMinimumFilter)
    : undefined;
}

export default async function Voorraad({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; onderMinimum?: string; externInBewerking?: string }>;
}) {
  const { page: pageParam, onderMinimum: onderMinimumParam, externInBewerking: externInBewerkingParam } =
    await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const onderMinimum = parseOnderMinimum(onderMinimumParam);
  const externInBewerking = externInBewerkingParam === "true" ? true : undefined;

  const { items, hasMore } = await getArtikelen(page, PAGE_SIZE, {
    onderMinimum,
    externInBewerking,
  });

  return (
    <AppShell>
      <VoorraadPage
        items={items}
        page={page}
        hasMore={hasMore}
        onderMinimum={onderMinimum}
        externInBewerking={externInBewerking ?? false}
      />
    </AppShell>
  );
}
