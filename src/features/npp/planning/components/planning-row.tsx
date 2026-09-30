import type { PlanningQueueItem } from "../types";

/** "YYYY-MM-DD" -> "DD/MM/YYYY" (string-based, no Date/timezone involved). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** One non-interactive queue row (this list is read-only). */
export function PlanningRow({
  item,
  showDate = false,
}: {
  item: PlanningQueueItem;
  showDate?: boolean;
}) {
  const article = [item.artnr.trim(), item.omschrijving.trim()].filter(Boolean).join(" \u00b7 ");

  return (
    <div className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium text-foreground">
          Bon {item.bonnr} / {item.groepnr}
        </span>
        <span className="text-sm text-muted-foreground">{item.klant}</span>
        {article && <span className="text-sm text-muted-foreground">{article}</span>}
        {showDate && item.levDatum && (
          <span className="text-xs text-muted-foreground">Lev: {formatDate(item.levDatum)}</span>
        )}
      </div>
      <span className="shrink-0 text-base font-medium text-foreground">{item.aantal}&times;</span>
    </div>
  );
}
