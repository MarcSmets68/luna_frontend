import { request } from "./http";

export type LoginRequest = { kode: string; password: string };

export type LoginResult = {
  token: string;
  kode: string;
  naam: string;
  niveau: number;
  everyoneAdminActive: boolean;
  expiresAt: string;
};

/**
 * Authenticates a gebruiker. See docs/architecture/login-auth-ontwerp.md
 * §1.2 for the exact request/response contract (incl. the 400/401/403
 * error messages, surfaced verbatim by request's error handling above).
 * Backend: POST /web/login (Luna.Web.LoginHandler + AuthBE.Login()).
 */
export async function login(payload: LoginRequest): Promise<LoginResult> {
  return request<LoginResult>("POST", "/login", { body: payload });
}

/**
 * Ends the session server-side (deletes the authenticationToken record).
 * Callers are expected to clear the local session (see
 * features/auth/session.ts) regardless of whether this call succeeds -
 * see docs/architecture/login-auth-ontwerp.md §1.3/§4.2.
 * Backend: POST /web/logout (Luna.Web.LogoutHandler + AuthBE.Logout()),
 * auth via "X-Auth-Token: <token>" header (§1.4 - PASOE/Tomcat intercepts
 * the standard "Authorization" header before it reaches the WebHandler,
 * so a custom header is used instead; see the deviation note in
 * docs/architecture/login-auth-ontwerp.md §1.4).
 */
export async function logout(token: string): Promise<{ message: string }> {
  return request<{ message: string }>("POST", "/logout", { body: {}, headers: { "X-Auth-Token": token } });
}
