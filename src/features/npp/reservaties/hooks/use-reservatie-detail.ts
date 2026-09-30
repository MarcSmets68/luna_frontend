"use client";

import { useEffect, useState } from "react";
import { getNppReservatieDetail } from "@/lib/api-client";
import type { NppReservatieDetail } from "../types";

const FALLBACK_ERROR = "Er ging iets mis bij het ophalen van de reservatie.";

type State = {
  key: string;
  data: NppReservatieDetail | null;
  error: string | null;
};

/** Server state for one bon's reservation detail. */
export function useReservatieDetail(bonnr: number, groepnr?: number) {
  const key = `${bonnr}:${groepnr ?? 0}`;
  const [result, setResult] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNppReservatieDetail(bonnr, groepnr).then(
      (data) => {
        if (!cancelled) setResult({ key, data, error: null });
      },
      (e) => {
        if (!cancelled)
          setResult({
            key,
            data: null,
            error: e instanceof Error ? e.message : FALLBACK_ERROR,
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [bonnr, groepnr, key]);

  const current = result && result.key === key ? result : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
  };
}
