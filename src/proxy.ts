import { NextResponse, type NextRequest } from "next/server";

// Makes /dev-users unreachable in production with a real HTTP 404 (a
// notFound() thrown while rendering the page streams with status 200).
// The page itself also refuses to render in production (defense in depth).
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.rewrite(new URL("/_dev-users-disabled", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dev-users", "/dev-users/:path*"],
};
