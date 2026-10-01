import { getOmzetanalyseDealers, type OmzetanalyseParams } from "@/lib/api-client";
import { OmzetanalyseExportToolbar } from "./omzetanalyse-export-toolbar";
import { OmzetanalyseReport } from "./omzetanalyse-report";

/**
 * Async server component: fetches the (potentially slow) analysis. Rendered
 * inside <Suspense> so the filter form stays visible while it loads.
 */
export async function OmzetanalyseResults({ params }: { params: OmzetanalyseParams }) {
  let response;
  try {
    response = await getOmzetanalyseDealers(params);
  } catch (error) {
    return (
      <div role="alert" className="rounded-md border border-destructive/30 p-4">
        <p className="text-sm font-semibold text-destructive">
          Het rapport kon niet geladen worden
        </p>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Onbekende fout"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {response.secties.length > 0 && (
        <div className="mb-4 flex justify-end">
          <OmzetanalyseExportToolbar response={response} />
        </div>
      )}
      <OmzetanalyseReport response={response} />
    </div>
  );
}

export function OmzetanalyseResultsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" data-testid="results-skeleton">
      <p className="text-sm text-muted-foreground">Rapport wordt geladen - dit kan even duren...</p>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
