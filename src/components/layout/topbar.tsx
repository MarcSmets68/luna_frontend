"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api-client";
import { clearSession, useSession, type Session } from "@/features/auth/session";
import { useInterfaceMode, setInterfaceMode, type InterfaceMode } from "@/features/interface-mode/interface-mode";

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
  const pathname = usePathname();
  // useSession() (see features/auth/session.ts) keeps the SSR render and
  // the client's hydration render in sync (both see null), then picks up
  // the real session right after mount - avoiding a hydration mismatch.
  const session = useSession();
  const mode = useInterfaceMode();

  function handleSwitch(target: InterfaceMode) {
    setInterfaceMode(target);
    if (target === "npp") {
      router.push("/npp");
    } else if (pathname === "/npp") {
      router.push("/");
    }
    // else: already somewhere in the Luna app, no navigation needed
  }

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
      router.push(LOGIN_PATH);
    }
  }

  return (
    <header
      className={cn(
        "relative flex h-14 shrink-0 items-center justify-end border-b border-border bg-card px-7",
        className
      )}
    >
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "luna" ? "default" : "outline"}
          onClick={() => handleSwitch("luna")}
        >
          Luna
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "npp" ? "default" : "outline"}
          onClick={() => handleSwitch("npp")}
        >
          NPP
        </Button>
      </div>
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
