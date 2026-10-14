"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DashDealer } from "../../lib/dashboard-types";

/**
 * Dealer multi-select dropdown (like the reference page): pill button,
 * search field, "Alle dealers" / "Enkel zichtbare" actions, checkbox list.
 * Empty selection = all dealers.
 */
export function DealerPicker({
  dealers,
  selected,
  onChange,
}: {
  dealers: DashDealer[];
  selected: ReadonlySet<number>;
  onChange: (next: Set<number>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return dealers;
    return dealers.filter(
      (d) => d.naam.toLowerCase().includes(needle) || String(d.klnr).includes(needle)
    );
  }, [dealers, q]);

  const label =
    selected.size === 0
      ? `Alle dealers (${dealers.length})`
      : selected.size === 1
        ? (dealers.find((d) => selected.has(d.klnr))?.naam ?? "1 dealer")
        : `${selected.size} dealers`;

  const toggle = (klnr: number, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(klnr);
    else next.delete(klnr);
    onChange(next);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => searchRef.current?.focus(), 0);
        }}
        className={cn(
          "inline-flex max-w-60 items-center gap-2 border px-3 py-1 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          selected.size > 0
            ? "border-primary bg-accent text-accent-foreground"
            : "border-border bg-card text-foreground hover:border-muted-foreground/40"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 w-72 border border-border bg-card p-2.5 shadow-lg">
          <Input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek een dealer"
            aria-label="Zoek een dealer in de lijst"
            className="mb-2 h-8 rounded-none text-[13px]"
          />
          <div className="mb-1.5 flex gap-4 text-[12px]">
            <button
              type="button"
              className="font-medium text-primary-600 hover:underline"
              onClick={() => onChange(new Set())}
            >
              Alle dealers
            </button>
            <button
              type="button"
              className="font-medium text-primary-600 hover:underline"
              onClick={() => onChange(new Set(visible.map((d) => d.klnr)))}
            >
              Enkel zichtbare
            </button>
          </div>
          <div className="max-h-64 overflow-auto">
            {visible.length === 0 && (
              <p className="px-1 py-2 text-[12px] text-muted-foreground">Geen dealers gevonden.</p>
            )}
            {visible.map((d) => (
              <label
                key={d.klnr}
                className="flex cursor-pointer items-center gap-2.5 px-1 py-1.5 text-[13px] hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.has(d.klnr)}
                  onCheckedChange={(v) => toggle(d.klnr, v === true)}
                />
                <span className="truncate">{d.naam}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
