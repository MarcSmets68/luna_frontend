import { cn } from "@/lib/utils";
import { getEffectiefStatus } from "../lib/effectief-status";
import type { NppReservatieDetailItem } from "../types";

/** One detail row: an item line (with status pill) or a non-item line. */
export function ReservatieDetailRow({
  item,
}: {
  item: NppReservatieDetailItem;
}) {
  if (item.effectiefStatus === null) {
    if (item.kolomtitel) {
      return (
        <div className="w-full px-4 pt-3 text-sm font-bold text-foreground">
          {item.omschrijving}
        </div>
      );
    }
    if (item.subtotaal) {
      return (
        <div className="w-full rounded-lg border border-border px-4 py-2 text-sm font-bold text-foreground">
          {item.omschrijving}
        </div>
      );
    }
    return (
      <div
        className={cn(
          "w-full px-4 py-1 text-sm text-muted-foreground",
          item.infolijn && "italic",
        )}
      >
        {item.omschrijving}
      </div>
    );
  }

  const status = getEffectiefStatus(item.effectiefStatus);

  return (
    <div className="flex min-h-11 w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium text-foreground">
          {item.artnr.trim()}
        </span>
        <span className="text-sm text-muted-foreground">
          {item.omschrijving}
        </span>
        <span className="text-xs text-muted-foreground">
          Te leveren: {item.teLeveren} &middot; Gereserveerd: {item.gereserv}{" "}
          &middot; Effectief: {item.effectiefGereserv}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
          status.className,
        )}
      >
        {status.label}
      </span>
    </div>
  );
}
