import { cookies } from "next/headers";
import type { LoginResult } from "@/lib/api-client";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "../cookie-names";

/** Non-sensitive part of the login response - the token is never exposed. */
export type AuthUser = Omit<LoginResult, "token">;

// `Secure` cookies are dropped by browsers over plain http (except on
// localhost), so it can be overridden with AUTH_COOKIE_SECURE=true|false.
function shouldUseSecureCookies(): boolean {
  const override = process.env.AUTH_COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.NODE_ENV === "production";
}

/**
 * Cookie lifetime follows the backend's `expiresAt`; an unparseable value
 * yields a browser-session cookie instead of a persistent one.
 */
function expiryOf(expiresAt: string): { expires?: Date } {
  const expires = new Date(expiresAt);
  return Number.isNaN(expires.getTime()) ? {} : { expires };
}

export async function getAuthToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_TOKEN_COOKIE)?.value || undefined;
}

/**
 * Stores the token in an httpOnly cookie and the user info in a second,
 * readable cookie, both expiring at `expiresAt`. Only allowed in server
 * actions and route handlers. Returns the user info (without token).
 */
export async function setSessionCookies(result: LoginResult): Promise<AuthUser> {
  const { token, ...user } = result;
  const store = await cookies();
  const base = {
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    ...expiryOf(user.expiresAt),
  };
  store.set(AUTH_TOKEN_COOKIE, token, { ...base, httpOnly: true });
  store.set(AUTH_USER_COOKIE, JSON.stringify(user), { ...base, httpOnly: false });
  return user;
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_TOKEN_COOKIE);
  store.delete(AUTH_USER_COOKIE);
}
