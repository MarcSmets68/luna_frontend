"use client";

import { Button } from "@/components/ui/button";
import type { MockLijn } from "../types";
import { LijnStatusBadge } from "./status-badge";

export function ReservatielijstTab({
  lijnen,
  onOpen,
}: {
  lijnen: MockLijn[];
  onOpen: (lijnId: string) => void;
}) {
  const teDoen = lijnen.filter((l) => l.status !== "gereed" && l.status !== "afgerond");

  if (teDoen.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Geen reservaties meer in de wachtrij.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {teDoen.map((lijn) => (
        <li
          key={lijn.id}
          className="flex min-h-11 w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-base font-medium text-foreground">
              Bon {lijn.bonnr} &middot; {lijn.armatuur} &times; {lijn.aantal}
            </span>
            {lijn.bezigDoor && (
              <span className="text-xs text-muted-foreground">
                Bezig door {lijn.bezigDoor}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LijnStatusBadge status={lijn.status} />
            <Button type="button" className="min-h-11" onClick={() => onOpen(lijn.id)}>
              Openen
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
