import { NextResponse, type NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE, LOGIN_PATH } from "@/features/auth/cookie-names";

// 1. /dev-users is unreachable in production with a real HTTP 404 (a
//    notFound() thrown while rendering the page streams with status 200).
//    The page itself also refuses to render in production (defense in depth).
// 2. Every route except /login redirects to /login while the httpOnly token
//    cookie is missing. This only checks presence: the cookie expires together
//    with the backend session, and a revoked token is caught by the central
//    401 handling in lib/api/http.ts.
// API routes are excluded: they answer with their own status codes.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/dev-users" || pathname.startsWith("/dev-users/"))
  ) {
    return NextResponse.rewrite(new URL("/_dev-users-disabled", request.url));
  }

  if (pathname === LOGIN_PATH || request.cookies.has(AUTH_TOKEN_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
