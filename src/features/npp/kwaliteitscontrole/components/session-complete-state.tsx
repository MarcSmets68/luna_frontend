"use client";

import { CheckCircle2 } from "lucide-react";

/**
 * Brief transition state after the last checklist item is answered -
 * auto-returns to the queue (see use-kwaliteitscontrole.ts's timeout),
 * no button/action here by design.
 */
export function SessionCompleteState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
      <CheckCircle2 className="size-10 text-success" strokeWidth={1.75} />
      <p className="text-base font-medium text-foreground">
        Alles gecontroleerd - wordt afgesloten...
      </p>
    </div>
  );
}
