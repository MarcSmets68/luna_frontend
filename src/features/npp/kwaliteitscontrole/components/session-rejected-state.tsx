"use client";

import { XCircle } from "lucide-react";

/**
 * Brief transition state after an afkeuring is submitted - auto-returns
 * to the queue (see use-kwaliteitscontrole.ts's timeout), no
 * button/action here by design.
 */
export function SessionRejectedState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
      <XCircle className="size-10 text-destructive" strokeWidth={1.75} />
      <p className="text-base font-medium text-foreground">Afgekeurd</p>
    </div>
  );
}
