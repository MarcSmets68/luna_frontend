"use client";

import { useMemo } from "react";
import { ListChecks, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanningQueue } from "../hooks/use-planning-queue";
import { groupByDay } from "../lib/group-by-day";
import { PlanningDayGroup } from "./planning-day-group";

export function PlanningView() {
  const { items, loading, error, refresh } = usePlanningQueue();
  const groups = useMemo(() => (items ? groupByDay(items, new Date()) : []), [items]);

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Productiewachtrij</h1>
          <p className="text-sm text-muted-foreground">
            LED-montagelijnen die klaarstaan voor productie, gesorteerd op leverdatum.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => refresh()} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : undefined} />
          Vernieuwen
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && !items && !error && (
        <p className="text-sm text-muted-foreground">Wachtrij wordt geladen...</p>
      )}

      {items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
          <ListChecks className="size-10 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-base font-medium text-foreground">Wachtrij is leeg</p>
          <p className="text-sm text-muted-foreground">
            Er staan momenteel geen LED-montagelijnen in de wachtrij.
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <PlanningDayGroup key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
