"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { requireSession } from "../require-session";
import { isSessionExpired, useSession } from "../session";

const PUBLIC_PATHS = ["/login"];

/**
 * Client-side route guard, mounted once in the root layout so it covers
 * every route except /login. Children are NOT rendered while there is no
 * valid session (a neutral loading state is shown instead), and the user is
 * redirected to /login.
 *
 * INTERIM SOLUTION: this is browser-only protection and no replacement for
 * server-side protection. Server components still fetch data without a token
 * and their output is part of the response sent to the browser; this guard
 * only prevents it from being rendered. It is to be replaced by an
 * httpOnly-cookie session + proxy.ts redirect (F4 step 2).
 */
export function RequireSessionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isPublic) requireSession(router);
  }, [router, pathname, isPublic]);

  if (isPublic || (session !== null && !isSessionExpired(session))) {
    return <>{children}</>;
  }

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-screen flex-1 items-center justify-center"
    >
      <span className="sr-only">Laden…</span>
    </div>
  );
}
