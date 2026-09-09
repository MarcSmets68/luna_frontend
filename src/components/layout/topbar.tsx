"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api-client";
import { clearSession, getSession, type Session } from "@/features/auth/session";

const LOGIN_PATH = "/login";

/** "Marc Smets" -> "MS", "Marc" -> "M", falls back to the kode. */
function initialsFor(session: Session): string {
  const naam = session.naam.trim();
  if (!naam) return session.kode.slice(0, 2).toUpperCase();

  const parts = naam.split(/\s+/);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0][0]];
  return letters.join("").toUpperCase();
}

export function Topbar({ className }: { className?: string }) {
  const router = useRouter();
  // Start with null on both server and client, then load session after
  // hydration to avoid mismatch (server has no localStorage access).
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  async function handleLogout() {
    try {
      if (session?.token) {
        await logout(session.token);
      }
    } catch {
      // Local session is cleared regardless of the API call's outcome -
      // see docs/architecture/login-auth-ontwerp.md §4.2.
    } finally {
      clearSession();
      setSession(null);
      router.push(LOGIN_PATH);
    }
  }

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-7",
        className
      )}
    >
      <Input
        type="text"
        placeholder="Zoek klanten, offertes, orders..."
        className="w-80 rounded-sm bg-background text-[13px]"
      />
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-[13px] font-semibold text-foreground">
            {session?.naam || session?.kode || "Niet ingelogd"}
          </div>
          <div className="text-[11px] text-muted-foreground">{session?.kode ?? ""}</div>
        </div>
        <Avatar className="h-8 w-8 border border-primary bg-accent">
          <AvatarFallback className="bg-accent text-[12px] font-bold text-primary">
            {session ? initialsFor(session) : "?"}
          </AvatarFallback>
        </Avatar>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          Uitloggen
        </Button>
      </div>
    </header>
  );
}
