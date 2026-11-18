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
import type { BonItem } from "@/lib/api-client";
import { OrdersFilters, type OrdersFiltersState } from "./orders-filters";
import { getBonTypeLabel } from "../lib/bon-stempel";
import { OrderCodeHelp } from "./order-code-help";
import { PageHeader } from "@/components/ui/page-header";
import { withOverviewContext } from "@/lib/overview-navigation";

/** Debounce (ms) before a filter change is pushed to the URL - avoids
    firing a server request on every keystroke in the Bonnr/Klant
    inputs. */
const FILTER_DEBOUNCE_MS = 400;

export function OrdersPage({
  items,
  page,
  hasMore,
  bonnr = "",
  naam = "",
}: {
  items: BonItem[];
  page: number;
  hasMore: boolean;
  bonnr?: string;
  naam?: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<OrdersFiltersState>({ bonnr, naam });
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
    setFilters({ bonnr, naam });
  }, [bonnr, naam]);

  useEffect(() => {
    if (filters.bonnr === bonnr && filters.naam === naam) return;

    const timeout = setTimeout(() => {
      pendingFilterPush.current = null;
      skipNextPropsSync.current = true;
      router.push(buildHref(1, filters));
    }, FILTER_DEBOUNCE_MS);

    pendingFilterPush.current = timeout;
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, bonnr, naam]);

  function buildHref(targetPage: number, state: OrdersFiltersState): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (state.bonnr) query.set("bonnr", state.bonnr);
    if (state.naam) query.set("naam", state.naam);

    return `/orders/alle?${query.toString()}`;
  }

  function goToBon(targetBonnr: number) {
    if (pendingFilterPush.current) clearTimeout(pendingFilterPush.current);
    router.push(withOverviewContext(`/orders/${targetBonnr}`, buildHref(page, { bonnr, naam }), "/orders/alle"));
  }

  return (
    <div>
      <PageHeader section="Orders & Productie" title="Alle orders">
        <span>Pagina {page}</span>
      </PageHeader>

      <OrdersFilters filters={filters} onFiltersChange={setFilters} />
      <OrderCodeHelp />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen orders gevonden.</p>
      ) : (
        <>
          <Table mobileLabel="Orders">
            <TableHeader>
              <TableRow>
                <TableHead>Bonnr</TableHead>
                <TableHead mobileHidden>Type</TableHead>
                <TableHead mobileHidden>Datum</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead mobileHidden>Stad</TableHead>
                <TableHead mobileHidden className="text-right">Bedrag</TableHead>
                <TableHead mobileHidden>Munt</TableHead>
                <TableHead>Leverdatum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.bonnr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open bon ${item.bonnr}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToBon(item.bonnr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToBon(item.bonnr);
                    }
                  }}
                >
                  <TableCell className="font-semibold text-primary-600">{item.bonnr}</TableCell>
                  <TableCell mobileHidden>{getBonTypeLabel(item.type)}</TableCell>
                  <TableCell mobileHidden>{formatDatum(item.datum)}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell mobileHidden>{item.stad}</TableCell>
                  <TableCell mobileHidden className="text-right font-medium">{formatBedrag(item.bedrag)}</TableCell>
                  <TableCell mobileHidden>{item.munt}</TableCell>
                  <TableCell>{formatDatum(item.levDatum)}</TableCell>
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
