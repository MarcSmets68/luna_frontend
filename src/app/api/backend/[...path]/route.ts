import { NextResponse, type NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/features/auth/cookie-names";
import { apiBaseUrl } from "@/lib/api/api-runtime.server";

// Same-origin proxy for calls made from the browser. The browser cannot read
// the httpOnly token cookie, so it sends its requests here and this handler
// forwards them to the PASOE backend with the token as `X-Auth-Token`.
// Login and logout have dedicated server actions and are not proxied.

const PREFIX = "/api/backend";
const BLOCKED_PATHS = ["/login", "/logout"];
const FORWARDED_REQUEST_HEADERS = ["accept", "content-type"];

function isSafePath(path: string): boolean {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return false;
  }
  if (!decoded.startsWith("/")) return false;
  if (decoded.split("/").some((segment) => segment === "." || segment === "..")) return false;
  return !BLOCKED_PATHS.includes(decoded.split("?")[0].replace(/\/+$/, ""));
}

// Defense in depth next to the SameSite=Lax cookie: a state-changing request
// that names an Origin must come from this very host.
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const json = (status: number, message: string) =>
  NextResponse.json({ error: { message, code: status } }, { status });

async function forward(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.pathname.slice(PREFIX.length);
  if (!isSafePath(path)) return json(404, "Niet gevonden");

  const isRead = request.method === "GET" || request.method === "HEAD";
  if (!isRead && !isSameOrigin(request)) return json(403, "Ongeldige oorsprong");

  const headers: Record<string, string> = {};
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (token) headers["X-Auth-Token"] = token;

  const upstream = await fetch(`${apiBaseUrl()}${path}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body: isRead ? undefined : await request.text(),
    cache: "no-store",
  });

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
  if (upstream.status === 401 && token) {
    response.cookies.delete(AUTH_TOKEN_COOKIE);
    response.cookies.delete(AUTH_USER_COOKIE);
  }
  return response;
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as DELETE,
};
