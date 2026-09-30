"use client";

import { useEffect, useState } from "react";
import { getPlanningQueue } from "@/lib/api-client";
import type { PlanningQueueItem } from "../types";

const FALLBACK_ERROR = "Er ging iets mis bij het ophalen van de wachtrij.";

/** Server state for the NPP production queue: fetch on mount + manual refresh. */
export function usePlanningQueue() {
  const [items, setItems] = useState<PlanningQueueItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function applyResult(data: { items: PlanningQueueItem[] }) {
    setItems(data.items);
    setLoading(false);
  }

  function applyError(e: unknown) {
    setError(e instanceof Error ? e.message : FALLBACK_ERROR);
    setItems(null);
    setLoading(false);
  }

  function refresh() {
    setLoading(true);
    setError(null);
    return getPlanningQueue().then(applyResult, applyError);
  }

  // Initial load: loading already starts as true, so no synchronous
  // setState is needed here; state is only set once the request settles.
  useEffect(() => {
    let cancelled = false;
    getPlanningQueue().then(
      (data) => {
        if (!cancelled) applyResult(data);
      },
      (e) => {
        if (!cancelled) applyError(e);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error, refresh };
}
