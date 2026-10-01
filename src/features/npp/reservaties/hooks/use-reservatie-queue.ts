"use client";

import { useCallback, useEffect, useState } from "react";
import { getNppReservatieQueue } from "@/lib/api-client";
import type { NppReservatieMode, NppReservatieQueueItem } from "../types";

const FALLBACK_ERROR = "Er ging iets mis bij het ophalen van de reservaties.";

type State = {
  mode: NppReservatieMode;
  items: NppReservatieQueueItem[] | null;
  dringendDagen: number;
  error: string | null;
  tick: number;
};

/** Server state for the reservation queue; refetches when `mode` changes or on refresh(). */
export function useReservatieQueue(mode: NppReservatieMode) {
  const [result, setResult] = useState<State | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNppReservatieQueue(mode).then(
      (data) => {
        if (!cancelled)
          setResult({
            mode,
            tick,
            items: data.items,
            dringendDagen: data.dringendDagen,
            error: null,
          });
      },
      (e) => {
        if (!cancelled)
          setResult({
            mode,
            tick,
            items: null,
            dringendDagen: 0,
            error: e instanceof Error ? e.message : FALLBACK_ERROR,
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [mode, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // A result only counts when it belongs to the current mode+tick; otherwise we're loading.
  const current =
    result && result.mode === mode && result.tick === tick ? result : null;

  return {
    items: current?.items ?? null,
    dringendDagen: current?.dringendDagen ?? 0,
    loading: current === null,
    error: current?.error ?? null,
    refresh,
  };
}
