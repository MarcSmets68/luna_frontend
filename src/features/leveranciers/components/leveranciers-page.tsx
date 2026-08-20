"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { LeverancierItem } from "@/lib/api-client";
import { DeleteLeverancierDialog } from "./delete-leverancier-dialog";

/** Debounce (ms) before a naam filter change is pushed to the URL - avoids
    firing a server request on every keystroke in the search field. */
const FILTER_DEBOUNCE_MS = 400;

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LeveranciersPage({
  items,
  page,
  hasMore,
  naam = "",
}: {
  items: LeverancierItem[];
  page: number;
  hasMore: boolean;
  naam?: string;
}) {
  const router = useRouter();
  const [naamFilter, setNaamFilter] = useState(naam);
  const isFirstRender = useRef(true);
  const skipNextPropsSync = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<LeverancierItem | null>(null);

  /* The URL is the source of truth (server component re-fetches on every
     navigation). Re-sync local state when the prop changes from outside our
     own debounced navigate() below - e.g. the browser back/forward button -
     but not right after we just pushed that same state ourselves. */
  useEffect(() => {
    if (skipNextPropsSync.current) {
      skipNextPropsSync.current = false;
      return;
    }
    setNaamFilter(naam);
  }, [naam]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      skipNextPropsSync.current = true;
      router.push(buildHref(1, naamFilter));
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naamFilter]);

  function buildHref(targetPage: number, naamValue: string): string {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (naamValue) query.set("naam", naamValue);

    return `/leveranciers?${query.toString()}`;
  }

  function goToLeverancier(levnr: number) {
    router.push(`/leveranciers/${levnr}`);
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Leveranciers
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Leveranciers</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">Pagina {page}</div>
          <Button
            type="button"
            size="sm"
            onClick={() => router.push("/leveranciers/nieuw")}
          >
            Nieuwe leverancier
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <label htmlFor="leveranciers-filter-naam" className="text-[12px] text-muted-foreground">
          Naam
        </label>
        <div className="relative w-[280px]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="leveranciers-filter-naam"
            className="pl-8"
            placeholder="Zoek op naam..."
            value={naamFilter}
            onChange={(e) => setNaamFilter(e.target.value)}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen leveranciers gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Levnr</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Postnr</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.levnr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open leverancier ${item.naam}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToLeverancier(item.levnr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToLeverancier(item.levnr);
                    }
                  }}
                >
                  <TableCell className="font-semibold">{item.levnr}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell>{item.adres}</TableCell>
                  <TableCell>{item.postnr}</TableCell>
                  <TableCell>{item.stad}</TableCell>
                  <TableCell>{formatSaldo(item.saldo)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Verwijder leverancier ${item.naam}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(item);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-end gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(page - 1, naamFilter)}
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
                href={buildHref(page + 1, naamFilter)}
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

      {deleteTarget && (
        <DeleteLeverancierDialog
          levnr={deleteTarget.levnr}
          naam={deleteTarget.naam}
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={() => {
            setDeleteTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
