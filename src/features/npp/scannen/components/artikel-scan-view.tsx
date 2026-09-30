"use client";

import { useArtikelScan } from "../hooks/use-artikel-scan";
import { ScannerInput } from "../../shared/scanner-input";
import { ArtikelScanResult } from "./artikel-scan-result";
import { ArtikelNotFoundState } from "./artikel-not-found-state";
import { ArtikelMultipleFoundState } from "./artikel-multiple-found-state";

/**
 * Top-level container for the NPP "Scannen / verifiëren" tile. Owns the
 * scan/result/loading/error state (via useArtikelScan). Deliberately never
 * unmounts/navigates after a scan - submitting a new value re-fetches and
 * replaces the shown result in place (same in-place re-scan pattern as
 * Boxoverzicht).
 */
export function ArtikelScanView() {
  const { result, loading, error, submitScan } = useArtikelScan();

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Scannen / verifiëren
        </h1>
        <p className="text-sm text-muted-foreground">Scan een artikel om de gegevens te tonen</p>
      </div>

      <ScannerInput
        onSubmit={submitScan}
        loading={loading}
        placeholder="Scan artikel..."
        ariaLabel="Artikel scannen"
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {result?.status === "resolved" && result.article && (
        <ArtikelScanResult article={result.article} />
      )}
      {result?.status === "not_found" && <ArtikelNotFoundState scan={result.scan} />}
      {result?.status === "multiple" && <ArtikelMultipleFoundState />}
    </div>
  );
}
