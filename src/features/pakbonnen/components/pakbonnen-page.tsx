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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { PakbonItem } from "@/lib/api-client";

/** Debounce (ms) before a filter change is pushed to the URL - avoids
    firing a server request on every keystroke, see OrdersPage. */
const FILTER_DEBOUNCE_MS = 400;

export type PakbonnenFiltersState = {
  paknr: string;
  naam: string;
  stempel: string;
};

export function PakbonnenPage({
  items,
  page,
  hasMore,
  paknr = "",
  naam = "",
  stempel = "",
}: {
  items: PakbonItem[];
  page: number;
  hasMore: boolean;
  paknr?: string;
  naam?: string;
  stempel?: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<PakbonnenFiltersState>({ paknr, naam, stempel });
  const isFirstRender = useRef(true);
  const skipNextPropsSync = useRef(false);

  useEffect(() => {
    if (skipNextPropsSync.current) {
      skipNextPropsSync.current = false;
      return;
    }
    setFilters({ paknr, naam, stempel });
  }, [paknr, naam, stempel]);

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

  function buildHref(targetPage: number, state: PakbonnenFiltersState): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (state.paknr) query.set("paknr", state.paknr);
    if (state.naam) query.set("naam", state.naam);
    if (state.stempel) query.set("stempel", state.stempel);

    return `/pakbonnen?${query.toString()}`;
  }

  function goToPakbon(paknr: number) {
    router.push(`/pakbonnen/${paknr}`);
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Pakbonnen
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Pakbonnen</h1>
        <div className="text-[13px] text-[#5e5e5e]">Pagina {page}</div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="pakbonnen-filter-paknr" className="text-[12px] text-muted-foreground">
            Paknr
          </label>
          <Input
            id="pakbonnen-filter-paknr"
            className="w-[140px]"
            placeholder="Paknr."
            value={filters.paknr}
            onChange={(e) => setFilters({ ...filters, paknr: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pakbonnen-filter-naam" className="text-[12px] text-muted-foreground">
            Klant
          </label>
          <Input
            id="pakbonnen-filter-naam"
            className="w-[200px]"
            placeholder="Klant"
            value={filters.naam}
            onChange={(e) => setFilters({ ...filters, naam: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pakbonnen-filter-stempel" className="text-[12px] text-muted-foreground">
            Stempel
          </label>
          <Input
            id="pakbonnen-filter-stempel"
            className="w-[160px]"
            placeholder="Stempel"
            value={filters.stempel}
            onChange={(e) => setFilters({ ...filters, stempel: e.target.value })}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen pakbonnen gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paknr</TableHead>
                <TableHead>Stempel</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Afgehaald</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.paknr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open pakbon ${item.paknr}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToPakbon(item.paknr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToPakbon(item.paknr);
                    }
                  }}
                >
                  <TableCell className="font-semibold">{item.paknr}</TableCell>
                  <TableCell>{item.stempel}</TableCell>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell>{item.stad}</TableCell>
                  <TableCell>{formatBedrag(item.nBedrag)}</TableCell>
                  <TableCell>{item.afgehaald ? "Ja" : "Nee"}</TableCell>
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
