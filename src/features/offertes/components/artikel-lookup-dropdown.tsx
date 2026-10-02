"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { zoekArtikelenAction, type ArtikelLookupItem } from "../lib/actions";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

type SearchState = {
  term: string;
  items: ArtikelLookupItem[];
  truncated: boolean;
  failed: boolean;
};

/**
 * Search dropdown attached to an artnr input. Render it inside a `relative`
 * container that also holds the input: keyboard events (Escape, arrows,
 * Enter-when-highlighted) are picked up from that container, so the input
 * itself needs no extra key handling. Enter is only intercepted while a
 * suggestion is highlighted.
 */
export function ArtikelLookupDropdown({
  term,
  open,
  onSelect,
  onClose,
}: {
  term: string;
  open: boolean;
  onSelect: (item: ArtikelLookupItem) => void;
  onClose: () => void;
}) {
  const trimmed = term.trim();
  const active = open && trimmed.length >= MIN_CHARS;
  const [state, setState] = useState<SearchState | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const requestId = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(async () => {
      const id = ++requestId.current;
      try {
        const res = await zoekArtikelenAction(trimmed);
        if (id !== requestId.current) return;
        setState({ term: trimmed, items: res.items, truncated: res.truncated, failed: false });
      } catch {
        if (id !== requestId.current) return;
        setState({ term: trimmed, items: [], truncated: false, failed: true });
      }
      setHighlight(-1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [active, trimmed]);

  const current = state && state.term === trimmed ? state : null;
  const items = current?.items;

  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      const container = rootRef.current?.parentElement;
      if (!container || !(e.target instanceof Node) || !container.contains(e.target)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowDown" && items && items.length > 0) {
        e.preventDefault();
        setHighlight((h) => (h + 1) % items.length);
      } else if (e.key === "ArrowUp" && items && items.length > 0) {
        e.preventDefault();
        setHighlight((h) => (h <= 0 ? items.length - 1 : h - 1));
      } else if (e.key === "Enter" && items && highlight >= 0 && highlight < items.length) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(items[highlight]);
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [active, items, highlight, onClose, onSelect]);

  if (!active) return <div ref={rootRef} hidden />;

  return (
    <div
      ref={rootRef}
      role="listbox"
      aria-label="Artikelen"
      className="absolute z-20 mt-1 max-h-60 w-80 overflow-y-auto rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
    >
      {!current && <div className="px-2.5 py-1.5 text-muted-foreground">Zoeken...</div>}
      {current?.failed && <div className="px-2.5 py-1.5 text-destructive">Zoeken mislukt</div>}
      {current && !current.failed && current.items.length === 0 && (
        <div className="px-2.5 py-1.5 text-muted-foreground">Geen artikelen gevonden</div>
      )}
      {current?.items.map((item, index) => (
        <button
          key={item.artnr}
          type="button"
          role="option"
          aria-selected={index === highlight}
          className={cn(
            "flex w-full items-baseline gap-2 px-2.5 py-1.5 text-left hover:bg-accent hover:text-accent-foreground",
            index === highlight && "bg-accent text-accent-foreground"
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(item)}
        >
          <span className="font-medium">{item.artnr}</span>
          <span className="min-w-0 flex-1 truncate">
            {item.omschrijvingNl || item.omschrijvingFr}
          </span>
          <span className="shrink-0 text-muted-foreground">{item.verkoopprijs}</span>
        </button>
      ))}
      {current && !current.failed && current.truncated && (
        <div className="px-2.5 py-1 text-xs text-muted-foreground">
          Meer resultaten — verfijn je zoekopdracht
        </div>
      )}
    </div>
  );
}
