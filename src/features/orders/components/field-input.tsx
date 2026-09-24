"use client";

import { Input } from "@/components/ui/input";

/**
 * Small labeled input helper shared across order-detail edit forms
 * (LED-configuratie form, bon-detail edit dialog, ...). Uppercase label
 * styling matches the section-heading convention used throughout this
 * feature folder.
 */
export function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
      {label}
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 font-normal normal-case"
      />
    </label>
  );
}
