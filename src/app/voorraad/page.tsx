import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { AANVULLING_HREF, AanvullingWerklijst } from "@/features/voorraad/components/aanvulling-werklijst";
import { VoorraadPage } from "@/features/voorraad/components/voorraad-page";
import { aanvullingFixtureBron } from "@/features/voorraad/lib/aanvulling-fixtures";
import { laadAanvullingWerklijst, type AanvullingZoekparams } from "@/features/voorraad/lib/aanvulling-werklijst";
import { getArtikelen } from "@/lib/api-client";

const PAGE_SIZE = 25;

function VoorraadNavigatie({ aanvulling = false }: { aanvulling?: boolean }) {
  return (
    <nav aria-label="Voorraadweergaven" className="mb-5 flex flex-wrap gap-2">
      <Link href="/voorraad" aria-current={aanvulling ? undefined : "page"} className={buttonVariants({ variant: aanvulling ? "outline" : "default" })}>
        Voorraadlijst
      </Link>
      <Link href={AANVULLING_HREF} aria-current={aanvulling ? "page" : undefined} className={buttonVariants({ variant: aanvulling ? "default" : "outline" })}>
        Aanvulling nakijken
      </Link>
    </nav>
  );
}

export default async function Voorraad({
  searchParams,
}: {
  searchParams: Promise<AanvullingZoekparams & { weergave?: string; lageVoorraad?: string; toonGeblokkeerd?: string; artnr?: string; omschrijving?: string }>;
}) {
  const params = await searchParams;
  if (params.weergave === "aanvulling") {
    const resultaat = await laadAanvullingWerklijst(aanvullingFixtureBron, params);
    return (
      <AppShell>
        <VoorraadNavigatie aanvulling />
        <AanvullingWerklijst resultaat={resultaat} />
      </AppShell>
    );
  }

  const {
    page: pageParam,
    lageVoorraad: lageVoorraadParam,
    toonGeblokkeerd: toonGeblokkeerdParam,
    artnr = "",
    omschrijving = "",
  } = params;
  const page = Math.max(1, Number(pageParam) || 1);
  const lageVoorraad = lageVoorraadParam === "true";
  const toonGeblokkeerd = toonGeblokkeerdParam === "true";
  const { items, hasMore } = await getArtikelen(page, PAGE_SIZE, {
    lageVoorraad,
    geblokkeerd: toonGeblokkeerd ? undefined : false,
    artnr,
    omschrijving,
  });

  return (
    <AppShell>
      <VoorraadNavigatie />
      <VoorraadPage
        items={items}
        page={page}
        hasMore={hasMore}
        lageVoorraad={lageVoorraad}
        toonGeblokkeerd={toonGeblokkeerd}
        artnr={artnr.trim()}
        omschrijving={omschrijving.trim()}
      />
    </AppShell>
  );
}
