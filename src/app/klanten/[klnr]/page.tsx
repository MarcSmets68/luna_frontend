import { AppShell } from "@/components/layout/app-shell";
import { KlantDetailPage } from "@/features/klanten/components/klant-detail-page";
import { KlantNotFound } from "@/features/klanten/components/klant-not-found";
import { getBonnen, getKlant, getOffertes } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function KlantDetail({
  params,
  searchParams,
}: {
  params: Promise<{ klnr: string }>;
  searchParams: Promise<{ offertesPage?: string; ordersPage?: string }>;
}) {
  const { klnr: klnrParam } = await params;
  const { offertesPage: offertesPageParam, ordersPage: ordersPageParam } = await searchParams;

  const klnr = Number(klnrParam);
  const offertesPage = Math.max(1, Number(offertesPageParam) || 1);
  const ordersPage = Math.max(1, Number(ordersPageParam) || 1);

  if (!Number.isInteger(klnr) || klnr <= 0) {
    return (
      <AppShell>
        <KlantNotFound klnr={klnrParam} />
      </AppShell>
    );
  }

  const klant = await getKlant(klnr);

  if (!klant) {
    return (
      <AppShell>
        <KlantNotFound klnr={klnrParam} />
      </AppShell>
    );
  }

  const [offertes, orders] = await Promise.all([
    getOffertes({ klnr, page: offertesPage, pageSize: PAGE_SIZE }),
    getBonnen({ klnr, type: "ORDERBEVESTIGING", page: ordersPage, pageSize: PAGE_SIZE }),
  ]);

  return (
    <AppShell>
      <KlantDetailPage
        klant={klant}
        offertes={offertes.items}
        offertesPage={offertes.page}
        offertesHasMore={offertes.hasMore}
        orders={orders.items}
        ordersPage={orders.page}
        ordersHasMore={orders.hasMore}
      />
    </AppShell>
  );
}
