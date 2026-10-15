// Browser/client-layer half of the environment adapter used by http.ts (see
// ./api-runtime.server.ts). The browser never talks to the backend directly:
// calls go to the same-origin proxy route (app/api/backend/[...path]), which
// adds the token from the httpOnly cookie. There is no cookie access here -
// only the server can read it.

import { AUTH_USER_COOKIE, LOGIN_PATH } from "@/features/auth/cookie-names";

export function apiBaseUrl(): string {
  return "/api/backend";
}

export async function readTokenFromCookie(): Promise<string | undefined> {
  return undefined;
}

/**
 * The proxy route answered 401: the session is gone. Drop the readable user
 * cookie (the proxy route already cleared the httpOnly one) and go to /login.
 */
export function handleUnauthorized(usedCookieToken: boolean): void {
  void usedCookieToken; // always relevant in the browser; kept for signature parity
  document.cookie = `${AUTH_USER_COOKIE}=; Max-Age=0; path=/`;
  window.location.assign(LOGIN_PATH);
}
