"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bonLabel, EFFECTIEF_STATUS_LABEL } from "../lib/format";
import type {
  ReservatieDetail as ReservatieDetailData,
  ReservatieDetailItem,
  ReservatieEffectiefStatus,
  ReservatieQueueItem,
} from "../types";

const STATUS_CLASS: Record<ReservatieEffectiefStatus, string> = {
  volledig_effectief: "bg-success-bg text-success-fg",
  gedeeltelijk_effectief: "bg-warning-bg text-warning-fg",
  geen_effectief: "bg-error-bg text-error-fg",
  niet_effectief: "bg-muted text-muted-foreground",
};

function DetailRow({ item }: { item: ReservatieDetailItem }) {
  if (!item.effectiefStatus) {
    const text = item.omschrijving.trim();
    if (!text) return null;
    return (
      <div className="px-1 pt-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {text}
      </div>
    );
  }

  const article = [item.artnr.trim(), item.omschrijving.trim()].filter(Boolean).join(" \u00b7 ");

  return (
    <div className="flex min-h-16 w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium text-foreground">{article}</span>
        <span className="text-sm text-muted-foreground">
          Te leveren {item.teLeveren} &middot; Gereserveerd {item.gereserv} &middot; Effectief{" "}
          {item.effectiefGereserv}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
          STATUS_CLASS[item.effectiefStatus]
        )}
      >
        {EFFECTIEF_STATUS_LABEL[item.effectiefStatus]}
      </span>
    </div>
  );
}

/** Read-only bonlijn overview for one queue row. */
export function ReservatieDetail({
  item,
  detail,
  loading,
  error,
  onBack,
}: {
  item: ReservatieQueueItem;
  detail: ReservatieDetailData | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Terug
        </Button>
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {bonLabel(item.bonnr, item.groepnr)}
          </h2>
          <p className="text-sm text-muted-foreground">{item.naam}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-muted-foreground">Bonlijnen worden geladen...</p>}

      {detail && detail.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Deze bon heeft geen lijnen.</p>
      )}

      {detail && detail.items.length > 0 && (
        <div className="flex flex-col gap-3">
          {detail.items.map((line) => (
            <DetailRow key={line.lijnnr} item={line} />
          ))}
        </div>
      )}
    </div>
  );
}
