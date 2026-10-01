"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { bonLabel, formatDate } from "../lib/format";
import type { ReservatieMode, ReservatieQueueItem } from "../types";

function Badge({ tone, children }: { tone: "error" | "warning" | "info"; children: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        tone === "error" && "bg-error-bg text-error-fg",
        tone === "warning" && "bg-warning-bg text-warning-fg",
        tone === "info" && "bg-info-bg text-info-fg"
      )}
    >
      {children}
    </span>
  );
}

/** One queue row - tap to see the bonlijnen and their reservation status. */
export function ReservatieQueueRow({
  item,
  mode,
  onOpen,
}: {
  item: ReservatieQueueItem;
  mode: ReservatieMode;
  onOpen: () => void;
}) {
  const dateLabel = mode === "productie" ? "Productie" : "Lev";
  const meta = [item.plaatsingWijze.trim(), item.transport.trim()].filter(Boolean).join(" \u00b7 ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors",
        "hover:bg-accent hover:text-accent-foreground active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        item.verwijderd && "opacity-70"
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium text-foreground">
          {bonLabel(item.bonnr, item.groepnr)}
        </span>
        <span className="text-sm text-muted-foreground">{item.naam}</span>
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
        {item.levDatum && (
          <span className="text-xs text-muted-foreground">
            {dateLabel}: {formatDate(item.levDatum)}
          </span>
        )}
        {item.verwijderd && item.deleteOpm && (
          <span className="text-xs text-muted-foreground">Opmerking: {item.deleteOpm}</span>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {item.verwijderd && <Badge tone="info">Verwijderd</Badge>}
        {item.dringend && <Badge tone="error">Dringend</Badge>}
        {item.swProductie && <Badge tone="warning">Onvoldoende voor productie</Badge>}
        {item.swNomaled && <Badge tone="info">Nomaled</Badge>}
        <ChevronRight className="size-5 text-muted-foreground" />
      </div>
    </button>
  );
}
