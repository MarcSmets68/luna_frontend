"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/features/auth/actions";
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

export function Topbar({ className, navigationTrigger }: { className?: string; navigationTrigger?: React.ReactNode }) {
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
      await logoutAction();
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
        "flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex items-center gap-3">
      {navigationTrigger}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === "luna" ? "default" : "outline"}
          aria-pressed={mode === "luna"}
          className={cn("h-7 border-transparent px-3 shadow-none", mode !== "luna" && "bg-transparent")}
          onClick={() => handleSwitch("luna")}
        >
          Luna
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "npp" ? "default" : "outline"}
          aria-pressed={mode === "npp"}
          className={cn("h-7 border-transparent px-3 shadow-none", mode !== "npp" && "bg-transparent")}
          onClick={() => handleSwitch("npp")}
        >
          NPP
        </Button>
      </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[13px] font-semibold text-foreground">
            {session?.naam || session?.kode || "Niet ingelogd"}
          </div>
          <div className="text-[11px] text-muted-foreground">{session?.kode ?? ""}</div>
        </div>
        <Avatar className="h-9 w-9 border border-primary/15 bg-accent">
          <AvatarFallback className="bg-accent text-[12px] font-semibold text-primary-600">
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
