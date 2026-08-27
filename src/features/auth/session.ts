// Encapsulates all sessionStorage access for the auth session - no
// component should call sessionStorage directly (see architecture doc
// docs/architecture/login-auth-ontwerp.md §4.3). Deliberately
// sessionStorage, not localStorage, per that same section.

const SESSION_KEY = "luna.auth.session";

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
