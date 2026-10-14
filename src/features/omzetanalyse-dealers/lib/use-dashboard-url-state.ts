"use client";

import { useCallback, useState } from "react";

export type DashboardTab = "dashboard" | "detail";

export function parseTab(v: string | undefined | null): DashboardTab {
  return v === "detail" ? "detail" : "dashboard";
}

/** Writes one query param without router navigation (no refetch / remount). */
function writeParam(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * Local state mirrored to `focus=YYYY` and `tab=dashboard|detail` via
 * history.replaceState. Initial values come from the page's searchParams.
 */
export function useDashboardUrlState(initial: { focus?: string | null; tab?: string | null }) {
  const [focus, setFocusState] = useState<string | null>(initial.focus ?? null);
  const [tab, setTabState] = useState<DashboardTab>(parseTab(initial.tab));

  const setFocus = useCallback((key: string) => {
    setFocusState(key);
    writeParam("focus", key);
  }, []);
  const setTab = useCallback((next: DashboardTab) => {
    setTabState(next);
    writeParam("tab", next === "dashboard" ? null : next);
  }, []);

  return { focus, tab, setFocus, setTab };
}
