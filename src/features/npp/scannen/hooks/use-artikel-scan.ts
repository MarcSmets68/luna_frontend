"use client";

import { useState } from "react";
import { getArtikelScan } from "@/lib/api-client";
import type { ArtikelScanResult } from "../types";

/**
 * Owns the scan/result/loading/error state for the NPP "Scannen /
 * verifiëren" tile. Deliberately supports in-place re-scan: calling
 * submitScan again re-fetches and replaces the previous result/error
 * without unmounting the view - same pattern as Boxoverzicht's
 * use-box-scan.ts.
 */
export function useArtikelScan() {
  const [result, setResult] = useState<ArtikelScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitScan = async (scan: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArtikelScan(scan);
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opzoeken van het artikel."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, submitScan };
}
