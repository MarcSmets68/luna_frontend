"use client";

import { Input } from "@/components/ui/input";

const MAX_LENGTH = 10;

/**
 * Nieuw magazijn input - only rendered by the caller when movementType is
 * "transfer_intern".
 */
export function MagazijnInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
      Nieuw magazijn
      <Input
        type="text"
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Nieuw magazijn"
        className="h-14 rounded-xl text-base"
      />
    </label>
  );
}
