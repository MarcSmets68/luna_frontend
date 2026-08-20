"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { BestelorderItem, BestelorderSortDir, BestelorderSortField } from "@/lib/api-client";
import { BestellingStatusBadge } from "./bestelling-status-badge";
import { BestellingenFilters, type BestellingenFiltersState } from "./bestellingen-filters";

/** Debounce (ms) before a filter/sort change is pushed to the URL - avoids
    firing a server request on every keystroke in the Ordernr/Leverancier
    inputs. */
const FILTER_DEBOUNCE_MS = 400;

export function BestellingenPage({
  items,
  page,
  hasMore,
  ordnr = "",
  naam = "",
  sortField = "ordnr",
  sortDir = "desc",
}: {
  items: BestelorderItem[];
  page: number;
  hasMore: boolean;
  ordnr?: string;
  naam?: string;
  sortField?: BestelorderSortField;
  sortDir?: BestelorderSortDir;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<BestellingenFiltersState>({
    ordnr,
    naam,
    sortField,
    sortDir,
  });
  const isFirstRender = useRef(true);
  const skipNextPropsSync = useRef(false);

  /* The URL is the source of truth (server component re-fetches on every
     navigation). Re-sync local state when the props change from outside
     our own debounced navigate() below - e.g. the browser back/forward
     button - but not right after we just pushed that same state
     ourselves. */
  useEffect(() => {
    if (skipNextPropsSync.current) {
      skipNextPropsSync.current = false;
      return;
    }
    setFilters({ ordnr, naam, sortField, sortDir });
  }, [ordnr, naam, sortField, sortDir]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      skipNextPropsSync.current = true;
      router.push(buildHref(1, filters));
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function buildHref(targetPage: number, state: BestellingenFiltersState): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (state.ordnr) query.set("ordnr", state.ordnr);
    if (state.naam) query.set("naam", state.naam);
    if (state.sortField !== "ordnr") query.set("sortField", state.sortField);
    if (state.sortDir !== "desc") query.set("sortDir", state.sortDir);

    return `/bestellingen?${query.toString()}`;
  }

  function goToBestelling(ordnr: number) {
    router.push(`/bestellingen/${ordnr}`);
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Bestellingen
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Bestellingen</h1>
        <div className="text-[13px] text-[#5e5e5e]">Pagina {page}</div>
      </div>

      <BestellingenFilters filters={filters} onFiltersChange={setFilters} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen bestellingen gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordnr</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Leverancier</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Munt</TableHead>
                <TableHead>Leverdatum</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.ordnr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open bestelling ${item.ordnr}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToBestelling(item.ordnr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToBestelling(item.ordnr);
                    }
                  }}
                >
                  <TableCell className="font-semibold">{item.ordnr}</TableCell>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell>{item.stad}</TableCell>
                  <TableCell>{formatBedrag(item.bedrag)}</TableCell>
                  <TableCell>{item.munt}</TableCell>
                  <TableCell>{formatDatum(item.levDatum)}</TableCell>
                  <TableCell>
                    <BestellingStatusBadge stempel={item.stempel} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-end gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(page - 1, filters)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <ChevronLeft />
                Vorige
              </Link>
            ) : (
              <span
                aria-disabled
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}
              >
                <ChevronLeft />
                Vorige
              </span>
            )}
            {hasMore ? (
              <Link
                href={buildHref(page + 1, filters)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Volgende
                <ChevronRight />
              </Link>
            ) : (
              <span
                aria-disabled
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}
              >
                Volgende
                <ChevronRight />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
