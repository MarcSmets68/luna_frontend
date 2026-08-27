"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { requireSession } from "../require-session";

/**
 * Client-side route guard for pages that require a valid session. On
 * mount, redirects to /login when there is no valid session (see
 * docs/architecture/login-auth-ontwerp.md paragraaf 4.5). Deliberately
 * applied to the root/dashboard route only for now - no other existing
 * route is protected yet.
 *
 * Renders `children` unconditionally (mirroring the reverse guard on
 * /login in login-page.tsx): the redirect itself is what prevents the
 * dashboard from being usable without a session.
 */
export function RequireSessionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    requireSession(router);
  }, [router]);

  return <>{children}</>;
}
