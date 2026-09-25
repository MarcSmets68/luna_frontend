"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StockBewegingResult } from "../types";

/**
 * Success state - shows the new voorraad/magazijn straight from the
 * server response (never recomputed client-side). "Nieuwe boeking"
 * resets the flow back to the "artikel" step without a full page reload.
 */
export function StockbewegingResultState({
  result,
  onReset,
}: {
  result: StockBewegingResult;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
      <CheckCircle2 className="size-10 text-primary-600" strokeWidth={1.75} />
      <p className="text-base font-medium text-foreground">Boeking geslaagd</p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">Artikel</dt>
        <dd className="text-foreground">{result.artikel.artnr}</dd>
        <dt className="text-muted-foreground">Nieuwe voorraad</dt>
        <dd className="text-foreground">{result.artikel.voorraad}</dd>
        <dt className="text-muted-foreground">Magazijn</dt>
        <dd className="text-foreground">{result.artikel.magazijn}</dd>
      </dl>
      <Button type="button" onClick={onReset} className="mt-2 h-12 rounded-xl px-6">
        Nieuwe boeking
      </Button>
    </div>
  );
}
