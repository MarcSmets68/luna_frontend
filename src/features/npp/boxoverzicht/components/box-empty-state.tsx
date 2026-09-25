import { PackageOpen } from "lucide-react";

/**
 * Rendered when result.empty === true (box/groepnr has no matching
 * lines) - an explicit message instead of the legacy screens silence.
 */
export function BoxEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
      <PackageOpen className="size-10 text-muted-foreground" strokeWidth={1.75} />
      <p className="text-base font-medium text-foreground">Deze box is leeg</p>
      <p className="text-sm text-muted-foreground">
        Er zijn geen artikelen gekoppeld aan deze groep.
      </p>
    </div>
  );
}
