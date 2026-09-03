import { AppShell } from "@/components/layout/app-shell";
import { KlantDetailPage } from "@/features/klanten/components/klant-detail-page";
import { KlantNotFound } from "@/features/klanten/components/klant-not-found";
import {
  getBonnen,
  getFacturen,
  getKlant,
  getKlantAdressen,
  getKlantContacten,
  getKlantKortingen,
  getOffertes,
} from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function KlantDetail({
  params,
  searchParams,
}: {
  params: Promise<{ klnr: string }>;
  searchParams: Promise<{
    offertesPage?: string;
    ordersPage?: string;
    facturenPage?: string;
  }>;
}) {
  const { klnr: klnrParam } = await params;
  const {
    offertesPage: offertesPageParam,
    ordersPage: ordersPageParam,
    facturenPage: facturenPageParam,
  } = await searchParams;

  const klnr = Number(klnrParam);
  const offertesPage = Math.max(1, Number(offertesPageParam) || 1);
  const ordersPage = Math.max(1, Number(ordersPageParam) || 1);
  const facturenPage = Math.max(1, Number(facturenPageParam) || 1);

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

  const [offertes, orders, adressen, contacten, kortingen, facturen] = await Promise.all([
    getOffertes({ klnr, page: offertesPage, pageSize: PAGE_SIZE }),
    getBonnen({ klnr, type: "ORDERBEVESTIGING", page: ordersPage, pageSize: PAGE_SIZE }),
    getKlantAdressen(klnr),
    getKlantContacten(klnr),
    getKlantKortingen(klnr),
    getFacturen({ klnr, page: facturenPage, pageSize: PAGE_SIZE }),
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
        adressen={adressen}
        contacten={contacten}
        kortingen={kortingen}
        facturen={facturen.items}
        facturenPage={facturen.page}
        facturenHasMore={facturen.hasMore}
      />
    </AppShell>
  );
}
