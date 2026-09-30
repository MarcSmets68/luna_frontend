import { AlertTriangle } from "lucide-react";

/**
 * Rendered when result.status === "multiple" - the scan matched more than
 * one artikel. Deliberately does NOT render `result.candidates` (present
 * in the API response) - showing/disambiguating that list is intentionally
 * left out of scope for this tile for now, operators are told to contact
 * administration instead.
 */
export function ArtikelMultipleFoundState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
      <AlertTriangle className="size-10 text-muted-foreground" strokeWidth={1.75} />
      <p className="text-base font-medium text-foreground">Meerdere artikelen gevonden</p>
      <p className="text-sm text-muted-foreground">
        Meerdere artikelen gevonden voor deze scan. Neem contact op met de administratie.
      </p>
    </div>
  );
}
