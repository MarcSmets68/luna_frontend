import { AppShell } from "@/components/layout/app-shell";
import { overviewReturnHref } from "@/lib/overview-navigation";
import { ArtikelDetailPage } from "@/features/voorraad/components/artikel-detail-page";
import { ArtikelNotFound } from "@/features/voorraad/components/artikel-not-found";
import { getArtikel } from "@/lib/api-client";
import { normalizeRouteParam } from "@/lib/utils";

export default async function ArtikelDetail({
  params,
  searchParams,
}: {
  params: Promise<{ artnr: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const query = await searchParams;
  const { artnr: artnrParam } = await params;
  const artnr = normalizeRouteParam(artnrParam);

  const artikel = await getArtikel(artnr);

  if (!artikel) {
    return (
      <AppShell>
        <ArtikelNotFound artnr={artnr} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ArtikelDetailPage artikel={artikel} backHref={overviewReturnHref(query?.returnTo, "/voorraad")} />
    </AppShell>
  );
}
