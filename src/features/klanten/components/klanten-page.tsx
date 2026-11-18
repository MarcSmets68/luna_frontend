"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import type { KlantItem } from "@/lib/api-client";
import { withOverviewContext } from "@/lib/overview-navigation";

/** Debounce (ms) before a naam filter change is pushed to the URL - avoids
    firing a server request on every keystroke in the search field. */
const FILTER_DEBOUNCE_MS = 400;

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function KlantenPage({
  items,
  page,
  hasMore,
  naam = "",
  nomaled = false,
}: {
  items: KlantItem[];
  page: number;
  hasMore: boolean;
  naam?: string;
  nomaled?: boolean;
}) {
  const router = useRouter();
  const [naamFilter, setNaamFilter] = useState(naam);
  const skipNextPropsSync = useRef(false);
  const previousNaam = useRef(naam);
  const pendingNaamPush = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* The URL is the source of truth (server component re-fetches on every
     navigation). Re-sync local state when the prop changes from outside our
     own debounced navigate() below - e.g. the browser back/forward button -
     but not right after we just pushed that same state ourselves. */
  useEffect(() => {
    if (previousNaam.current === naam) return;
    previousNaam.current = naam;
    if (skipNextPropsSync.current) {
      skipNextPropsSync.current = false;
      return;
    }
    setNaamFilter(naam);
  }, [naam]);

  useEffect(() => {
    if (naamFilter === naam) return;

    const timeout = setTimeout(() => {
      pendingNaamPush.current = null;
      skipNextPropsSync.current = true;
      router.push(buildHref(1, naamFilter, nomaled));
    }, FILTER_DEBOUNCE_MS);
    pendingNaamPush.current = timeout;

    return () => {
      clearTimeout(timeout);
      if (pendingNaamPush.current === timeout) {
        pendingNaamPush.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naamFilter, naam]);

  function buildHref(targetPage: number, naamValue: string, nomaledValue: boolean): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (naamValue) query.set("naam", naamValue);
    if (nomaledValue) query.set("nomaled", "true");

    return `/klanten?${query.toString()}`;
  }

  function goToKlant(klnr: number) {
    if (pendingNaamPush.current) clearTimeout(pendingNaamPush.current);
    router.push(withOverviewContext(`/klanten/${klnr}`, buildHref(page, naam, nomaled), "/klanten"));
  }

  function selectDealerFilter(next: boolean) {
    if (next === nomaled) return;
    if (pendingNaamPush.current) {
      clearTimeout(pendingNaamPush.current);
      pendingNaamPush.current = null;
    }
    router.push(buildHref(1, naamFilter, next));
  }

  return (
    <div>
      <PageHeader section="Klanten" title="Klanten">
          <div className="text-[13px] text-muted-foreground">Pagina {page}</div>
          <Button type="button" size="sm" onClick={() => router.push("/klanten/nieuw")}>
            Nieuwe klant
          </Button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-(--shadow-surface)">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="klanten-filter-naam" className="text-[12px] text-muted-foreground">
            Naam
          </label>
          <div className="relative w-[280px] max-w-full">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="klanten-filter-naam"
              className="pl-8"
              placeholder="Zoek op naam (bv. Smets Marc)..."
              value={naamFilter}
              onChange={(e) => setNaamFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-muted-foreground">Filter</span>
          <div role="group" aria-label="Klantenfilter" className="flex h-9 items-stretch [&_button]:h-auto">
            <Button
              type="button"
              size="sm"
              variant={nomaled ? "outline" : "default"}
              className="rounded-r-none"
              onClick={() => selectDealerFilter(false)}
            >
              Alle klanten
            </Button>
            <Button
              type="button"
              size="sm"
              variant={nomaled ? "default" : "outline"}
              className="-ml-px rounded-l-none"
              onClick={() => selectDealerFilter(true)}
            >
              Nomaled-dealers
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen klanten gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klantnr</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Postnr</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Telefoon</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Geblokkeerd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.klnr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open klant ${item.naam}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToKlant(item.klnr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToKlant(item.klnr);
                    }
                  }}
                >
                  <TableCell className="font-semibold text-primary-600">{item.klnr}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell>{item.adres}</TableCell>
                  <TableCell>{item.postnr}</TableCell>
                  <TableCell>{item.stad}</TableCell>
                  <TableCell>{item.tel}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell className="text-right font-medium">{formatSaldo(item.saldo)}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", item.geblokkeerd ? "bg-error-bg text-error-fg" : "bg-muted text-muted-foreground")}>
                      {item.geblokkeerd ? "Ja" : "Nee"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-end gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(page - 1, naamFilter, nomaled)}
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
                href={buildHref(page + 1, naamFilter, nomaled)}
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
