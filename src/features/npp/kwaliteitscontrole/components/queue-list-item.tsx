"use client";

import { cn } from "@/lib/utils";
import type { QcQueueItem } from "../types";

/**
 * One row in the QC queue - tap to start (or resume, if the operator
 * already has an open session for this bon/groep) a checklist session.
 * Rows currently in progress by someone else are shown but disabled
 * (tapping would just 409 from the backend - clearer to not let the
 * operator try).
 */
export function QueueListItem({
  item,
  starting,
  onStart,
}: {
  item: QcQueueItem;
  starting: boolean;
  onStart: () => void;
}) {
  const disabled = starting || item.inProgressByOther;

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={disabled}
      className={cn(
        "flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        !disabled && "hover:bg-accent hover:text-accent-foreground active:translate-y-px",
        disabled && "opacity-60"
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-medium text-foreground">
          Bon {item.bonnr} / {item.groepnr}
        </span>
        <span className="text-sm text-muted-foreground">
          {item.klant} &middot; {item.profielgroep}
        </span>
        {item.montageDatum && (
          <span className="text-xs text-muted-foreground">Montage: {item.montageDatum}</span>
        )}
      </div>

      {item.inProgressByOther ? (
        <span className="rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning-fg">
          In bewerking door een andere gebruiker
        </span>
      ) : item.hasInProgressSession ? (
        <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success-fg">
          {starting ? "Bezig..." : "Hervatten"}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">{starting ? "Bezig..." : "Starten"}</span>
      )}
    </button>
  );
}
