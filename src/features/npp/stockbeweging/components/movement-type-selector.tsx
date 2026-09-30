"use client";

import { cn } from "@/lib/utils";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES } from "../types";
import type { StockBewegingMovementType } from "../types";

/**
 * Large touch buttons (NOT a dropdown/<select>) for picking the
 * movementType - one button per type, PRD §4.1 touch-UI principle
 * (large touch targets, minimal info density).
 */
export function MovementTypeSelector({
  value,
  onChange,
}: {
  value: StockBewegingMovementType | null;
  onChange: (type: StockBewegingMovementType) => void;
}) {
  return (
    <div role="group" aria-label="Type beweging" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MOVEMENT_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={value === type}
          onClick={() => onChange(type)}
          className={cn(
            "min-h-14 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === type
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {MOVEMENT_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
