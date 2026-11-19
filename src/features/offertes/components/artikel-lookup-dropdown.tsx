"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
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
  input,
  term,
  open,
  onSelect,
  onClose,
}: {
  input: ReactElement<InputHTMLAttributes<HTMLInputElement>>;
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
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const hasPortal = position !== null;
  const listboxId = useId();

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

  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current?.querySelector("input");
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const height = rootRef.current?.getBoundingClientRect().height || 240;
      const above = window.innerHeight - rect.bottom - 4 < height;
      setPosition({ left: rect.left, top: above ? rect.top - 4 : rect.bottom + 4, above });
    }
    updatePosition();
    if (!active) return;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active, current, hasPortal]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      const container = anchorRef.current?.parentElement;
      if (!(e.target instanceof Node) || (!container?.contains(e.target) && !rootRef.current?.contains(e.target))) return;
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

  return (
    <span ref={anchorRef} className="contents">
      {cloneElement(input, {
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-expanded": active,
        "aria-controls": listboxId,
        "aria-activedescendant": active && items?.[highlight] ? `${listboxId}-${highlight}` : undefined,
      })}
      {position && createPortal(<div
        ref={rootRef}
        id={listboxId}
        hidden={!active}
        role="listbox"
        aria-label="Artikelen"
        style={{ left: position.left, top: position.top, transform: position.above ? "translateY(-100%)" : undefined }}
        className="fixed z-30 max-h-60 w-80 overflow-y-auto rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
      >
        {!current && <div className="px-2.5 py-1.5 text-muted-foreground">Zoeken...</div>}
        {current?.failed && <div role="alert" className="px-2.5 py-1.5 text-destructive">Zoeken mislukt</div>}
        {current && !current.failed && current.items.length === 0 && (
          <div className="px-2.5 py-1.5 text-muted-foreground">Geen artikelen gevonden</div>
        )}
        {current?.items.map((item, index) => (
          <button
            key={item.artnr}
            id={`${listboxId}-${index}`}
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
      </div>, document.body)}
    </span>
  );
}
