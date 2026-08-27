// Route-guard helper built on top of session.ts - reads the session,
// validates expiresAt, and redirects. See
// docs/architecture/login-auth-ontwerp.md §4.5: not applied to any
// existing route yet (only used, in reverse, on the /login page itself -
// see login-page.tsx), but written to be reusable for future protected
// pages via requireSession().

import { getValidSession, type Session } from "./session";

type RouterLike = { replace: (href: string) => void };

const DEFAULT_LOGIN_PATH = "/login";
const DEFAULT_DASHBOARD_PATH = "/";

/**
 * For pages that require a logged-in user (not applied anywhere yet).
 * Redirects to `redirectTo` (default `/login`) when there is no valid
 * session, otherwise returns the session.
 */
export function requireSession(
  router: RouterLike,
  redirectTo: string = DEFAULT_LOGIN_PATH
): Session | null {
  const session = getValidSession();
  if (!session) {
    router.replace(redirectTo);
    return null;
  }
  return session;
}

/**
 * Reverse guard used on the /login page itself: if a valid session already
 * exists, skip the login screen and redirect straight to `redirectTo`
 * (default `/`, the dashboard). Returns whether it redirected.
 */
export function redirectIfAuthenticated(
  router: RouterLike,
  redirectTo: string = DEFAULT_DASHBOARD_PATH
): boolean {
  const session = getValidSession();
  if (session) {
    router.replace(redirectTo);
    return true;
  }
  return false;
}
