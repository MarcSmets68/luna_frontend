// Shared (client-safe) constants for the cookie-based session.

/** httpOnly cookie holding the backend token; never readable by browser JS. */
export const AUTH_TOKEN_COOKIE = "luna.auth.token";

/** Readable cookie with non-sensitive user info (kode, naam, niveau, ...). */
export const AUTH_USER_COOKIE = "luna.auth.user";

export const LOGIN_PATH = "/login";

/** Route handler that clears the session cookies and redirects to /login. */
export const SESSION_EXPIRED_PATH = "/api/auth/session-expired";
