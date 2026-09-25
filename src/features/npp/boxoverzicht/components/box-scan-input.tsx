"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";

/**
 * Scan entry field for the Boxoverzicht tile. Auto-focuses on mount and
 * whenever a scan finishes (success or error) so the operator can keep
 * scanning without touching the screen - this is the in-place re-scan
 * requirement (see hooks/use-box-scan.ts).
 */
export function BoxScanInput({
  onSubmitScan,
  loading,
}: {
  onSubmitScan: (value: string) => void;
  loading: boolean;
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
    onSubmitScan(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-3">
      <Input
        ref={inputRef}
        type="text"
        autoFocus
        disabled={loading}
        placeholder="Scan boxlabel..."
        aria-label="Boxlabel scannen"
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
