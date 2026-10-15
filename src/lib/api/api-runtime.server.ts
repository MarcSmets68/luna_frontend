import { redirect, unstable_rethrow } from "next/navigation";
import { getAuthToken } from "@/features/auth/server/session-cookies";
import { SESSION_EXPIRED_PATH } from "@/features/auth/cookie-names";

// Server-side half of the environment adapter used by http.ts, reached
// through the "#api-runtime" subpath import (package.json) so `next/headers`
// never reaches the browser bundle. The client layer gets
// ./api-runtime.client.ts instead.

// Use server-side env var (not NEXT_PUBLIC_) to keep API URL private
const LOCAL_API_BASE_URL = "http://localhost:8080/web";

/**
 * Backend base URL. Resolved lazily (per request) so `next build` does not
 * fail when the variable is only provided at runtime. In production a
 * missing variable is a configuration error; the localhost fallback is for
 * local development only.
 */
export function apiBaseUrl(): string {
  const configured = process.env.API_BASE_URL;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "API_BASE_URL environment variable is not set. It is required in production.",
    );
  }
  return LOCAL_API_BASE_URL;
}

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
 * user to /login). Does nothing when no cookie token was sent (e.g. /login
 * or an explicitly passed token).
 */
export function handleUnauthorized(usedCookieToken: boolean): void {
  if (usedCookieToken) redirect(SESSION_EXPIRED_PATH);
}
