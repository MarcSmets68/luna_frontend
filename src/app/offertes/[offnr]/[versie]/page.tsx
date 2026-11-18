import { AppShell } from "@/components/layout/app-shell";
import { overviewReturnHref } from "@/lib/overview-navigation";
import { OfferteDetailPage } from "@/features/offertes/components/offerte-detail-page";
import { OfferteNotFound } from "@/features/offertes/components/offerte-not-found";
import { getOfferte, getOfferteLijnen } from "@/lib/api-client";

export default async function OfferteDetail({
  params,
  searchParams,
}: {
  params: Promise<{ offnr: string; versie: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const query = await searchParams;
  const { offnr: offnrParam, versie: versieParam } = await params;
  const offnr = Number(offnrParam);
  const versie = Number(versieParam);

  if (!Number.isInteger(offnr) || offnr <= 0 || !Number.isInteger(versie) || versie <= 0) {
    return (
      <AppShell>
        <OfferteNotFound offnr={offnrParam} versie={versieParam} />
      </AppShell>
    );
  }

  const [offerte, lijnenResult] = await Promise.all([
    getOfferte(offnr, versie),
    getOfferteLijnen(offnr, versie).then(
      (lijnen) => ({ ok: true as const, lijnen }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
  ]);

  if (!offerte) {
    return (
      <AppShell>
        <OfferteNotFound offnr={offnrParam} versie={versieParam} />
      </AppShell>
    );
  }

  if (!lijnenResult.ok) throw lijnenResult.error;
  const lijnen = lijnenResult.lijnen;

  return (
    <AppShell>
      <OfferteDetailPage offerte={offerte} lijnen={lijnen} backHref={overviewReturnHref(query?.returnTo, "/offertes/alle")} />
    </AppShell>
  );
}
