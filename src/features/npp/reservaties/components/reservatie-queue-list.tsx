"use client";

import { BookmarkCheck } from "lucide-react";
import { queueItemKey } from "../lib/format";
import type { ReservatieMode, ReservatieQueueItem } from "../types";
import { ReservatieQueueRow } from "./reservatie-queue-row";

export function ReservatieQueueList({
  items,
  loading,
  mode,
  onOpen,
}: {
  items: ReservatieQueueItem[] | null;
  loading: boolean;
  mode: ReservatieMode;
  onOpen: (item: ReservatieQueueItem) => void;
}) {
  if (loading && !items) {
    return <p className="text-sm text-muted-foreground">Reservaties worden geladen...</p>;
  }

  if (!items) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <BookmarkCheck className="size-10 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-base font-medium text-foreground">Geen reservaties</p>
        <p className="text-sm text-muted-foreground">
          Er staan momenteel geen reservaties open om op te volgen.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ReservatieQueueRow
          key={queueItemKey(item)}
          item={item}
          mode={mode}
          onOpen={() => onOpen(item)}
        />
      ))}
    </div>
  );
}
