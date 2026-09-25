"use client";

import { useState } from "react";
import { getBoxOverzicht } from "@/lib/api-client";
import type { BoxOverzichtResult } from "../types";

/**
 * Owns the scan/result/loading/error state for the NPP "Boxoverzicht"
 * tile. Deliberately supports in-place re-scan: calling submitScan again
 * re-fetches and replaces the previous result/error without unmounting
 * the view - a confirmed deviation from the legacy screen (which always
 * exits the screen after one scan).
 */
export function useBoxScan() {
  const [result, setResult] = useState<BoxOverzichtResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitScan = async (scan: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBoxOverzicht(scan);
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opzoeken van de box."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, submitScan };
}
