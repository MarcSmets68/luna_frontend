"use client";

import { useState } from "react";
import { useBoxScan } from "../hooks/use-box-scan";
import { BoxScanInput } from "./box-scan-input";
import { BoxHeader } from "./box-header";
import { BoxArticleList } from "./box-article-list";
import { BoxEmptyState } from "./box-empty-state";
import { BoxLabelPrintView } from "./box-label-print-view";
import type { BoxOverzichtArticle } from "../types";

/**
 * Top-level container for the NPP "Boxoverzicht" tile. Owns the
 * scan/result/loading/error state (via useBoxScan) and the print
 * selection. Deliberately never unmounts/navigates after a scan -
 * submitting a new value re-fetches and replaces the shown result
 * in place (confirmed product deviation from the legacy screen).
 */
export function BoxScanView() {
  const { result, loading, error, submitScan } = useBoxScan();
  const [printArticle, setPrintArticle] = useState<BoxOverzichtArticle | null>(null);

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Boxoverzicht</h1>
        <p className="text-sm text-muted-foreground">Scan een boxlabel om de inhoud te tonen</p>
      </div>

      <BoxScanInput onSubmitScan={submitScan} loading={loading} />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <BoxHeader result={result} />
          {result.empty ? (
            <BoxEmptyState />
          ) : (
            <BoxArticleList articles={result.articles} onPrint={setPrintArticle} />
          )}
        </div>
      )}

      <BoxLabelPrintView article={printArticle} onPrinted={() => setPrintArticle(null)} />
    </div>
  );
}
