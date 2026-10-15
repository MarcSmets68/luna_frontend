// Client-side helper built on top of session.ts. Route protection itself is
// done server-side by src/proxy.ts (httpOnly token cookie); this only offers
// the reverse guard used on the /login page.

import { getValidSession } from "./session";

type RouterLike = { replace: (href: string) => void };

const DEFAULT_DASHBOARD_PATH = "/";

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
