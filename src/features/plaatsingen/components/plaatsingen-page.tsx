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
import { formatDatum } from "@/lib/format";
import type { PlaatsingItem } from "../types";
import { PlaatsingenFilters, type PlaatsingenFiltersState } from "./plaatsingen-filters";
import { PlaatsingStatusBadge } from "./plaatsing-status-badge";

/** Debounce (ms) before a filter change is pushed to the URL - avoids
    firing a re-render on every keystroke in the Planr/Klant inputs. */
const FILTER_DEBOUNCE_MS = 400;

export function PlaatsingenPage({
  items,
  page,
  hasMore,
  planr = "",
  naam = "",
}: {
  items: PlaatsingItem[];
  page: number;
  hasMore: boolean;
  planr?: string;
  naam?: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<PlaatsingenFiltersState>({ planr, naam });
  const isFirstRender = useRef(true);
  const skipNextPropsSync = useRef(false);
  const isSyncingFromProps = useRef(false);

  useEffect(() => {
    if (skipNextPropsSync.current) {
      skipNextPropsSync.current = false;
      return;
    }
    isSyncingFromProps.current = true;
    setFilters({ planr, naam });
  }, [planr, naam]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isSyncingFromProps.current) {
      isSyncingFromProps.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      skipNextPropsSync.current = true;
      router.push(buildHref(1, filters));
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function buildHref(targetPage: number, state: PlaatsingenFiltersState): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (state.planr) query.set("planr", state.planr);
    if (state.naam) query.set("naam", state.naam);

    return `/plaatsingen?${query.toString()}`;
  }

  function goToPlaatsing(planrValue: number) {
    router.push(`/plaatsingen/${planrValue}`);
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Plaatsingen
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Plaatsingen</h1>
        <div className="text-[13px] text-[#5e5e5e]">Pagina {page}</div>
      </div>

      <PlaatsingenFilters filters={filters} onFiltersChange={setFilters} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen plaatsingen gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Planr</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Technieker</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Plaatsingsdatum</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.planr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open plaatsing ${item.planr}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToPlaatsing(item.planr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToPlaatsing(item.planr);
                    }
                  }}
                >
                  <TableCell className="font-semibold">{item.planr}</TableCell>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell className="whitespace-normal">{item.klantNaam}</TableCell>
                  <TableCell>{item.vrtgwNaam}</TableCell>
                  <TableCell>{item.project ?? "\u2014"}</TableCell>
                  <TableCell>{formatDatum(item.plaatsingsdatum)}</TableCell>
                  <TableCell>{item.lstad}</TableCell>
                  <TableCell>
                    <PlaatsingStatusBadge datumAfsluiting={item.datumAfsluiting} />
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
