"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";

/**
 * Generic scan entry field shared across NPP touch tiles. Auto-focuses on
 * mount and whenever a scan finishes (loading flips back to false) so the
 * operator can keep scanning without touching the screen - the in-place
 * re-scan pattern first established by Boxoverzicht's BoxScanInput.
 *
 * Deliberately no keystroke-interval/timing logic: a barcode scanner and a
 * human typing + Enter are treated identically (confirmed product
 * decision - the legacy 2000ms timing hack is not ported).
 *
 * Note: box-scan-input.tsx is NOT refactored to use this component in this
 * PR - that's a deliberate, separate follow-up.
 */
export function ScannerInput({
  onSubmit,
  loading,
  placeholder,
  ariaLabel,
}: {
  onSubmit: (value: string) => void;
  loading: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    if (!value) return;
    onSubmit(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-3">
      <Input
        ref={inputRef}
        type="text"
        autoFocus
        disabled={loading}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-14 flex-1 rounded-xl border-border text-lg"
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-14 min-w-14 rounded-xl px-6 text-base"
      >
        <ScanLine className="size-5" />
        {loading ? "Bezig..." : "Scan"}
      </Button>
    </form>
  );
}
