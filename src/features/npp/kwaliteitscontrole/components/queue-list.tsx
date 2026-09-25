"use client";

import { ClipboardCheck } from "lucide-react";
import { QueueListItem } from "./queue-list-item";
import type { QcQueueItem } from "../types";

/**
 * Renders the QC queue - a loading state, an empty state (nothing to
 * control right now), or the list of rows. Does not fetch/own state
 * itself - see use-kwaliteitscontrole.ts.
 */
export function QueueList({
  items,
  loading,
  startingKey,
  onStart,
}: {
  items: QcQueueItem[] | null;
  loading: boolean;
  startingKey: string | null;
  onStart: (item: QcQueueItem) => void;
}) {
  if (loading && !items) {
    return <p className="text-sm text-muted-foreground">Wachtrij wordt geladen...</p>;
  }

  if (items && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <ClipboardCheck className="size-10 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-base font-medium text-foreground">Niets te controleren</p>
        <p className="text-sm text-muted-foreground">
          Er staan momenteel geen bon/groep-combinaties klaar voor kwaliteitscontrole.
        </p>
      </div>
    );
  }

  if (!items) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <QueueListItem
          key={`${item.bonnr}-${item.groepnr}`}
          item={item}
          starting={startingKey === `${item.bonnr}-${item.groepnr}`}
          onStart={() => onStart(item)}
        />
      ))}
    </div>
  );
}
