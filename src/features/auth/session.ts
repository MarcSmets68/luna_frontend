// Client-side access to the non-sensitive user info of the logged-in session.
// The backend token is NOT available here: it lives in an httpOnly cookie that
// only the server can read (see features/auth/server/session-cookies.ts). The
// user info is kept in a second, readable cookie (AUTH_USER_COOKIE) that the
// login server action sets; no component should touch document.cookie
// directly.

import { useSyncExternalStore } from "react";
import { AUTH_USER_COOKIE } from "./cookie-names";

// Key used before the cookie-based session; removed on logout/cleanup.
const LEGACY_SESSION_KEY = "luna.auth.session";

// Listeners notified whenever the stored session changes (login/logout),
// so components can subscribe via useSession() below instead of reading
// the cookie directly during render (see useSession() for why that
// matters for SSR/hydration).
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export type Session = {
  kode: string;
  naam: string;
  niveau: number;
  everyoneAdminActive: boolean;
  expiresAt: string;
};

function hasDocument(): boolean {
  return typeof document !== "undefined";
}

function readRawCookie(): string | null {
  if (!hasDocument()) return null;
  const prefix = `${AUTH_USER_COOKIE}=`;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
}

function parseRaw(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Session;
  } catch {
    return null;
  }
}

/**
 * Writes the user-info cookie (the login server action already set it; this
 * keeps the client in sync and notifies subscribers). Only the known,
 * non-sensitive fields are stored.
 */
export function saveSession(session: Session): void {
  if (!hasDocument()) return;
  const { kode, naam, niveau, everyoneAdminActive, expiresAt } = session;
  const value = encodeURIComponent(
    JSON.stringify({ kode, naam, niveau, everyoneAdminActive, expiresAt })
  );
  const expires = new Date(expiresAt);
  const expiry = Number.isNaN(expires.getTime()) ? "" : `; expires=${expires.toUTCString()}`;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_USER_COOKIE}=${value}; path=/; SameSite=Lax${expiry}${secure}`;
  notify();
}

/** Reads the raw stored session, if any - no expiry check. */
export function getSession(): Session | null {
  return parseRaw(readRawCookie());
}

/**
 * Removes the readable user info (logout, or passive cleanup of an expired
 * session). The httpOnly token cookie is cleared server-side (logoutAction /
 * the session-expired route).
 */
export function clearSession(): void {
  if (!hasDocument()) return;
  document.cookie = `${AUTH_USER_COOKIE}=; Max-Age=0; path=/`;
  window.sessionStorage?.removeItem(LEGACY_SESSION_KEY);
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
// caches the last snapshot by the raw cookie string and only re-parses
// when that string actually changed.
let cachedRaw: string | null = null;
let cachedSnapshot: Session | null = null;

function getSessionSnapshot(): Session | null {
  const raw = readRawCookie();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = parseRaw(raw);
  }
  return cachedSnapshot;
}

function getServerSnapshot(): Session | null {
  return null;
}

/**
 * Subscribes a component to the stored session via useSyncExternalStore,
 * re-rendering it on login/logout. Reading the cookie directly in
 * render (or in a lazy useState initializer) would return one value
 * during SSR (null, no window) and a different one on the client's
 * hydration render pass - a hydration mismatch. useSyncExternalStore
 * avoids that: getServerSnapshot always returns null, matching the SSR
 * output, and the client picks up the real session right after mount.
 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSessionSnapshot, getServerSnapshot);
}
