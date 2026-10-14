import { Suspense } from "react";
import type { OmzetanalyseParams } from "@/lib/api-client";
import { OmzetanalyseResults, OmzetanalyseResultsSkeleton } from "./omzetanalyse-results";

/**
 * Fixed scope for this page: Nomaled dealers, per dealer, incl. zero-revenue
 * dealers. Exported so the rapportage landing page can warm the fetch cache
 * with the exact same request.
 */
export const OMZETANALYSE_PARAMS: OmzetanalyseParams = {
  soort: "DNOM",
  perDealer: true,
  inclusiefZonderOmzet: true,
};

export function OmzetanalyseDealersPage({
  initialFocus,
  initialTab,
}: {
  initialFocus?: string;
  initialTab?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Rapportage
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Omzetanalyse dealers</h1>
      </div>

      <Suspense fallback={<OmzetanalyseResultsSkeleton />}>
        <OmzetanalyseResults params={OMZETANALYSE_PARAMS} initialFocus={initialFocus} initialTab={initialTab} />
      </Suspense>
    </div>
  );
}
