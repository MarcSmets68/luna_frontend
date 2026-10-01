import { Suspense } from "react";
import type { OmzetanalyseParams, SoortItem } from "@/lib/api-client";
import {
  OmzetanalyseFilterForm,
  type OmzetanalyseFilterValues,
} from "./omzetanalyse-filter-form";
import { OmzetanalyseResults, OmzetanalyseResultsSkeleton } from "./omzetanalyse-results";

export function OmzetanalyseDealersPage({
  soorten,
  filters,
  uitvoeren,
  queryString,
}: {
  soorten: SoortItem[];
  filters: OmzetanalyseFilterValues;
  uitvoeren: boolean;
  queryString: string;
}) {
  const params: OmzetanalyseParams = {
    datumVan: filters.datumVan || undefined,
    datumTot: filters.datumTot || undefined,
    klnr: filters.klnr ?? undefined,
    soort: filters.soort || undefined,
    perDealer: filters.soort ? filters.perDealer : false,
  };

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Rapportage
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Omzetanalyse dealers</h1>
      </div>

      <OmzetanalyseFilterForm soorten={soorten} initial={filters} />

      {uitvoeren ? (
        <Suspense key={queryString} fallback={<OmzetanalyseResultsSkeleton />}>
          <OmzetanalyseResults params={params} />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">Kies filters en klik op Toon rapport</p>
      )}
    </div>
  );
}
