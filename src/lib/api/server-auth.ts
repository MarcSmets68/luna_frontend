import { redirect, unstable_rethrow } from "next/navigation";
import { getAuthToken } from "@/features/auth/server/session-cookies";
import { SESSION_EXPIRED_PATH } from "@/features/auth/cookie-names";

// Server-only helpers for http.ts, reached through the "#server-auth" subpath
// import (package.json) so `next/headers` never reaches the browser bundle;
// the client layer gets ./server-auth.client.ts instead.

/** The token from the httpOnly cookie, or undefined when there is none. */
export async function readTokenFromCookie(): Promise<string | undefined> {
  try {
    return await getAuthToken();
  } catch (error) {
    // Re-throw Next.js internals (e.g. dynamic-usage signals); anything else
    // means we are outside a request scope, where there is no cookie.
    unstable_rethrow(error);
    return undefined;
  }
}

/**
 * Central 401 handling: the backend rejected the cookie token. Cookies can
 * only be cleared in a route handler, so redirect there (it then sends the
 * user to /login). Never returns.
 */
export function redirectToSessionExpired(): never {
  redirect(SESSION_EXPIRED_PATH);
}
