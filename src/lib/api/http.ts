// Shared HTTP layer for the PASOE WebHandler client. Components must not call
// fetch() directly (see root AGENTS.md, frontend constraints); every domain
// module in this folder goes through `request()`.

// Use server-side env var (not NEXT_PUBLIC_) to keep API URL private
const LOCAL_API_BASE_URL = "http://localhost:8080/web";

// Resolved lazily (per request) so `next build` does not fail when the
// variable is only provided at runtime. In production a missing variable is a
// configuration error; the localhost fallback is for local development only.
function getApiBaseUrl(): string {
  const configured = process.env.API_BASE_URL;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "API_BASE_URL environment variable is not set. It is required in production.",
    );
  }
  return LOCAL_API_BASE_URL;
}

/**
 * Error thrown by `request` on a non-OK response. Extends Error (same
 * `.message` as before) and additionally exposes the HTTP status and the
 * backend's own error message, so callers can branch on 404/409.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly backendMessage?: string;
  constructor(status: number, message: string, backendMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.backendMessage = backendMessage;
  }
}

/**
 * Builds one URL path segment from a parameter (bonnr, offnr, versie,
 * lijnnr, ...). Every dynamic path segment must go through this helper.
 */
export function pathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type RequestOptions = {
  /** JSON body; only sent (with `Content-Type`) for POST and PUT. */
  body?: unknown;
  /**
   * Extra headers merged into the request - used for auth-bearing calls
   * (e.g. logout()'s "X-Auth-Token: <token>").
   */
  headers?: Record<string, string>;
  /**
   * Next.js fetch cache config. When set on a GET it replaces the default
   * `cache: "no-store"`.
   */
  next?: { revalidate?: number | false };
  /** Resolve to `null` on a 404 instead of throwing. */
  nullOn404?: boolean;
  /**
   * Surface the backend's `{"error":{"message":...}}` text as the error
   * message (default). When `false` the body is not read and the message is
   * the generic "API request to <path> failed with status <n>".
   */
  backendErrorMessages?: boolean;
};

export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions & { nullOn404: true },
): Promise<T | null>;
export async function request<T>(
  method: HttpMethod,
  path: string,
  options?: RequestOptions,
): Promise<T>;
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  const hasBody = method === "POST" || method === "PUT";
  const init: RequestInit & { next?: RequestOptions["next"] } = {
    method,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  };
  if (hasBody) init.body = JSON.stringify(options.body);
  if (method === "GET") {
    if (options.next) init.next = options.next;
    else init.cache = "no-store";
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, init);

  if (options.nullOn404 && response.status === 404) return null;

  if (!response.ok) {
    const genericMessage = `API request to ${path} failed with status ${response.status}`;
    if (options.backendErrorMessages === false) {
      throw new ApiError(response.status, genericMessage);
    }
    const error = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const backendMessage = error?.error?.message;
    throw new ApiError(response.status, backendMessage ?? genericMessage, backendMessage);
  }

  return response.json() as Promise<T>;
}
