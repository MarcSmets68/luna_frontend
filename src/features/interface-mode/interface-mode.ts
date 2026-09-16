// Persists which top-level interface (Luna vs. the placeholder NPP
// atelier screen) is currently active, so a topbar toggle survives
// client-side navigation and page reloads within the same tab.
// Deliberately sessionStorage, not localStorage, mirroring the
// convention in features/auth/session.ts. This module is intentionally
// independent of features/auth/session - logging out must not reset
// the interface mode.

import { useSyncExternalStore } from "react";

export type InterfaceMode = "luna" | "npp";

const STORAGE_KEY = "luna.interfaceMode";
const DEFAULT_MODE: InterfaceMode = "luna";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isInterfaceMode(value: unknown): value is InterfaceMode {
  return value === "luna" || value === "npp";
}

/** Persists the active interface mode and notifies subscribers. */
export function setInterfaceMode(mode: InterfaceMode): void {
  if (!hasStorage()) return;
  window.sessionStorage.setItem(STORAGE_KEY, mode);
  notify();
}

/**
 * Reads the stored interface mode, defaulting to "luna" for anything
 * missing/invalid/unreadable - never throws.
 */
export function getInterfaceMode(): InterfaceMode {
  try {
    if (!hasStorage()) return DEFAULT_MODE;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return isInterfaceMode(raw) ? raw : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// useSyncExternalStore requires getSnapshot() to return a stable
// (===-equal) reference as long as nothing actually changed. Caching by
// the raw stored string mirrors features/auth/session.ts's
// getSessionSnapshot() so repeated reads of an unchanged value don't
// trigger extra re-renders.
let cachedRaw: string | null = null;
let cachedSnapshot: InterfaceMode = DEFAULT_MODE;

function getSnapshot(): InterfaceMode {
  const raw = hasStorage() ? window.sessionStorage.getItem(STORAGE_KEY) : null;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getInterfaceMode();
  }
  return cachedSnapshot;
}

function getServerSnapshot(): InterfaceMode {
  return DEFAULT_MODE;
}

/**
 * Subscribes a component to the stored interface mode via
 * useSyncExternalStore, re-rendering it whenever setInterfaceMode() is
 * called. getServerSnapshot always returns "luna", matching the SSR
 * output, avoiding a hydration mismatch (see features/auth/session.ts's
 * useSession() for the same pattern).
 */
export function useInterfaceMode(): InterfaceMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
