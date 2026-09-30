import { PackageOpen } from "lucide-react";

/**
 * Rendered when result.status === "not_found" - mirrors Boxoverzicht's
 * box-empty-state.tsx visual style so the two touch-UI tiles feel
 * consistent.
 */
export function ArtikelNotFoundState({ scan }: { scan: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
      <PackageOpen className="size-10 text-muted-foreground" strokeWidth={1.75} />
      <p className="text-base font-medium text-foreground">Artikel niet gevonden</p>
      <p className="text-sm text-muted-foreground">
        Geen artikel gevonden voor scan &quot;{scan}&quot;.
      </p>
    </div>
  );
}
