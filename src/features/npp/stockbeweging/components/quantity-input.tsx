"use client";

import { Input } from "@/components/ui/input";

/**
 * Numeric aantal input, ≥44px touch target (PRD §4.1). Hidden entirely by
 * the caller for movementType "transfer_intern" - aantal doesn't apply
 * there.
 */
export function QuantityInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
      Aantal
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Aantal"
        className="h-14 rounded-xl text-lg"
      />
    </label>
  );
}
