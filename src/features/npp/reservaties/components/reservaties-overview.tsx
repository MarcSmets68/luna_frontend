"use client";

import { BookmarkCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservatieQueue } from "../hooks/use-reservatie-queue";
import type { NppReservatieMode } from "../types";
import { ReservatieModeTabs } from "./reservatie-mode-tabs";
import { ReservatieQueueRow } from "./reservatie-queue-row";

export function ReservatiesOverview({
  mode,
  onModeChange,
}: {
  mode: NppReservatieMode;
  onModeChange: (mode: NppReservatieMode) => void;
}) {
  const { items, loading, error, refresh } = useReservatieQueue(mode);

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Reservaties
          </h1>
          <p className="text-sm text-muted-foreground">
            Raadpleeg de reservaties per bon (direct of productie).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={loading ? "animate-spin" : undefined} />
          Vernieuwen
        </Button>
      </div>

      <ReservatieModeTabs mode={mode} onChange={onModeChange} />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">
          Reservaties worden geladen...
        </p>
      )}

      {!loading && items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
          <BookmarkCheck
            className="size-10 text-muted-foreground"
            strokeWidth={1.75}
          />
          <p className="text-base font-medium text-foreground">
            Geen reservaties
          </p>
          <p className="text-sm text-muted-foreground">
            Er staan momenteel geen bons in deze lijst.
          </p>
        </div>
      )}

      {!loading && items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={`${item.bonnr}-${item.groepnr}`}>
              <ReservatieQueueRow
                item={item}
                productie={mode === "productie"}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
