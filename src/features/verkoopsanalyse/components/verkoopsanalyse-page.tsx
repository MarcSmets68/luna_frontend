import { Suspense } from "react";
import { getKlanten } from "@/lib/api-client";
import { buildSelectieQuery, parseSelectie, type VerkoopsanalyseSearchParams } from "../lib/verkoopsanalyse-model";
import { VerkoopsanalyseFilters, type DealerOptie } from "./verkoopsanalyse-filters";
import { VerkoopsanalyseResults, VerkoopsanalyseResultsSkeleton } from "./verkoopsanalyse-results";

const DEALER_PAGE_SIZE = 200;
const MAX_DEALER_PAGES = 10;

/** All Nomaled dealers for the picker, sorted by name. */
async function loadDealers(): Promise<DealerOptie[]> {
  const dealers: DealerOptie[] = [];
  for (let page = 1; page <= MAX_DEALER_PAGES; page++) {
    const res = await getKlanten({ nomaled: true, page, pageSize: DEALER_PAGE_SIZE });
    dealers.push(...res.items.map((k) => ({ klnr: k.klnr, naam: k.naam })));
    if (!res.hasMore) break;
  }
  return dealers.sort((a, b) => a.naam.localeCompare(b.naam, "nl-BE"));
}

export async function VerkoopsanalysePage({ searchParams }: { searchParams: VerkoopsanalyseSearchParams }) {
  const selectie = parseSelectie(searchParams);
  const toon = searchParams.toon === "1";

  let dealers: DealerOptie[] = [];
  let dealersFout = false;
  try {
    dealers = await loadDealers();
  } catch {
    dealersFout = true;
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Rapportage
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Verkoopsanalyse</h1>
      </div>

      {/* key: reset the form state when the URL selection changes (back/forward). */}
      <VerkoopsanalyseFilters
        key={buildSelectieQuery(selectie)}
        dealers={dealers}
        dealersFout={dealersFout}
        initial={selectie}
      />

      {toon ? (
        <Suspense key={buildSelectieQuery(selectie)} fallback={<VerkoopsanalyseResultsSkeleton />}>
          <VerkoopsanalyseResults selectie={selectie} />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">
          Kies dealers en artikelen, en klik op <span className="font-medium">Analyse maken</span>. Je krijgt
          de omzet en de aantallen per maand over de afgelopen 12 maanden, telkens naast dezelfde maand een
          jaar eerder.
        </p>
      )}
    </div>
  );
}
