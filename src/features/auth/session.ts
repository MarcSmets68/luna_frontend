// Encapsulates all sessionStorage access for the auth session - no
// component should call sessionStorage directly (see architecture doc
// docs/architecture/login-auth-ontwerp.md §4.3). Deliberately
// sessionStorage, not localStorage, per that same section.

import { useSyncExternalStore } from "react";

const SESSION_KEY = "luna.auth.session";

// Listeners notified whenever the stored session changes (login/logout),
// so components can subscribe via useSession() below instead of reading
// sessionStorage directly during render (see useSession() for why that
// matters for SSR/hydration).
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export type Session = {
  token: string;
  kode: string;
  naam: string;
  niveau: number;
  everyoneAdminActive: boolean;
  expiresAt: string;
};

function hasSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** Persists the session from a successful login() response. */
export function saveSession(session: Session): void {
  if (!hasSessionStorage()) return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();
}

/** Reads the raw stored session, if any - no expiry check. */
export function getSession(): Session | null {
  if (!hasSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/** Removes the stored session (logout, or passive cleanup of an expired one). */
export function clearSession(): void {
  if (!hasSessionStorage()) return;
  window.sessionStorage.removeItem(SESSION_KEY);
  notify();
}

/** True when `session.expiresAt` is missing/unparseable or in the past. */
export function isSessionExpired(session: Session): boolean {
  const expiresAt = new Date(session.expiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

/**
 * Reads the session and validates `expiresAt`. Clears an expired session
 * as a side effect (passive cleanup, mirroring the backend's approach in
 * AuthBE.ValidateToken - see architecture doc §6) and returns null for it.
 */
export function getValidSession(): Session | null {
  const session = getSession();
  if (!session) return null;
  if (isSessionExpired(session)) {
    clearSession();
    return null;
  }
  return session;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// useSyncExternalStore requires getSnapshot() to return a stable
// (===-equal) reference as long as nothing actually changed, or it
// re-renders forever. getSession() re-parses JSON on every call, so this
// caches the last snapshot by the raw stored string and only re-parses
// when that string actually changed.
let cachedRaw: string | null = null;
let cachedSnapshot: Session | null = null;

function getSessionSnapshot(): Session | null {
  const raw = hasSessionStorage() ? window.sessionStorage.getItem(SESSION_KEY) : null;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getSession();
  }
  return cachedSnapshot;
}

function getServerSnapshot(): Session | null {
  return null;
}

/**
 * Subscribes a component to the stored session via useSyncExternalStore,
 * re-rendering it on login/logout. Reading sessionStorage directly in
 * render (or in a lazy useState initializer) would return one value
 * during SSR (null, no window) and a different one on the client's
 * hydration render pass - a hydration mismatch. useSyncExternalStore
 * avoids that: getServerSnapshot always returns null, matching the SSR
 * output, and the client picks up the real session right after mount.
 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSessionSnapshot, getServerSnapshot);
}
