"use server";

import { login, logout } from "@/lib/api/auth";
import type { LoginRequest } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import {
  clearSessionCookies,
  getAuthToken,
  setSessionCookies,
  type AuthUser,
} from "./server/session-cookies";

export type LoginActionResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string; status?: number };

const LOGIN_FAILED = "Inloggen is mislukt. Probeer het opnieuw.";

/**
 * Logs in against the backend and stores the token in an httpOnly cookie.
 * Returns an envelope instead of throwing: errors thrown from server actions
 * lose their message in production builds, and the backend's own messages
 * (400/401/403/429) must reach the login form verbatim.
 */
export async function loginAction(payload: LoginRequest): Promise<LoginActionResult> {
  try {
    const result = await login(payload);
    return { ok: true, user: await setSessionCookies(result) };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : LOGIN_FAILED,
      status: e instanceof ApiError ? e.status : undefined,
    };
  }
}

/**
 * Ends the session server-side and always clears the cookies, regardless of
 * whether the backend call succeeds (same as the previous client flow).
 */
export async function logoutAction(): Promise<void> {
  try {
    const token = await getAuthToken();
    if (token) await logout(token);
  } catch {
    // Cookies are cleared regardless of the backend call's outcome.
  } finally {
    await clearSessionCookies();
  }
}
