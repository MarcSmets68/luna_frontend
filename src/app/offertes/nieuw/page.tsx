import { AppShell } from "@/components/layout/app-shell";
import { OfferteCreatePage } from "@/features/offertes/components/offerte-create-page";
import { KlantNotFound } from "@/features/klanten/components/klant-not-found";
import { getKlant } from "@/lib/api-client";

export default async function OfferteNieuw({
  searchParams,
}: {
  searchParams: Promise<{ klnr?: string }>;
}) {
  const { klnr: klnrParam } = await searchParams;
  const klnr = Number(klnrParam);

  if (!Number.isInteger(klnr) || klnr <= 0) {
    return (
      <AppShell>
        <KlantNotFound klnr={klnrParam ?? ""} />
      </AppShell>
    );
  }

  const klant = await getKlant(klnr);

  if (!klant) {
    return (
      <AppShell>
        <KlantNotFound klnr={klnrParam ?? ""} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <OfferteCreatePage klant={klant} />
    </AppShell>
  );
}
