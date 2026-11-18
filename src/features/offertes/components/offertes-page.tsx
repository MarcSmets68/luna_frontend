"use client";

import { PageHeader } from "@/components/ui/page-header";

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
import { formatBedrag, formatDatum, statusLabel } from "@/lib/format";
import type { OfferteItem } from "@/lib/api-client";
import { OffertesFilters, type OffertesFiltersState } from "./offertes-filters";
import { withOverviewContext } from "@/lib/overview-navigation";

/** Debounce (ms) before a filter change is pushed to the URL - avoids
    firing a server request on every keystroke in the Offnr/Klant
    inputs. */
const FILTER_DEBOUNCE_MS = 400;

export function OffertesPage({
  items,
  page,
  hasMore,
  offnr = "",
  naam = "",
}: {
  items: OfferteItem[];
  page: number;
  hasMore: boolean;
  offnr?: string;
  naam?: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<OffertesFiltersState>({ offnr, naam });
  const skipNextPropsSync = useRef(false);
  const pendingFilterPush = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setFilters({ offnr, naam });
  }, [offnr, naam]);

  useEffect(() => {
    if (filters.offnr === offnr && filters.naam === naam) return;

    const timeout = setTimeout(() => {
      pendingFilterPush.current = null;
      skipNextPropsSync.current = true;
      router.push(buildHref(1, filters));
    }, FILTER_DEBOUNCE_MS);

    pendingFilterPush.current = timeout;
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, offnr, naam]);

  function buildHref(targetPage: number, state: OffertesFiltersState): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (state.offnr) query.set("offnr", state.offnr);
    if (state.naam) query.set("naam", state.naam);

    return `/offertes/alle?${query.toString()}`;
  }

  function goToOfferte(targetOffnr: number, versie: number) {
    if (pendingFilterPush.current) clearTimeout(pendingFilterPush.current);
    router.push(withOverviewContext(`/offertes/${targetOffnr}/${versie}`, buildHref(page, { offnr, naam }), "/offertes/alle"));
  }

  return (
    <div>
      <PageHeader section="Offertes" title="Alle offertes">
        <span>Pagina {page}</span>
      </PageHeader>

      <OffertesFilters filters={filters} onFiltersChange={setFilters} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen offertes gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offnr</TableHead>
                <TableHead>Versie</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead>Munt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={`${item.offnr}-${item.versie}`}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open offerte ${item.offnr}/${item.versie}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToOfferte(item.offnr, item.versie)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToOfferte(item.offnr, item.versie);
                    }
                  }}
                >
                  <TableCell className="font-semibold text-primary-600">{item.offnr}</TableCell>
                  <TableCell>{item.versie}</TableCell>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell>{item.stad}</TableCell>
                  <TableCell className="text-right font-medium">{formatBedrag(item.bedrag)}</TableCell>
                  <TableCell>{item.munt}</TableCell>
                  <TableCell>{statusLabel(item)}</TableCell>
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
