import type { BoxOverzichtResult } from "../types";

/**
 * Minimal context header for the scanned box: bon, klant, groep and the
 * bon-opmerking. "niets" is a normal literal opmerking value (not a
 * special "no opmerking" case) - rendered as-is, per the backend
 * contract.
 */
export function BoxHeader({ result }: { result: BoxOverzichtResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Bon {result.bonnr} &middot; Groep {result.groepnr}
        </h2>
        <span className="text-sm text-muted-foreground">{result.klant}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Opmerking: {result.opmerking}</p>
    </div>
  );
}
