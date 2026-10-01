"use client";

import { cn } from "@/lib/utils";
import type { ReservatieMode } from "../types";

const MODES: { id: ReservatieMode; label: string }[] = [
  { id: "direct", label: "Direct" },
  { id: "productie", label: "Productie" },
];

export function ReservatieModeSwitch({
  mode,
  onChange,
}: {
  mode: ReservatieMode;
  onChange: (mode: ReservatieMode) => void;
}) {
  return (
    <div role="tablist" aria-label="Modus" className="flex rounded-lg border border-border bg-card p-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "min-h-11 rounded-md px-4 text-sm font-medium transition-colors",
            mode === m.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
