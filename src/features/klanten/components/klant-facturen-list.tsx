"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DataTablePanel } from "@/components/ui/data-table-panel";
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
import type { FactuurItem } from "@/lib/api-client";

export function KlantFacturenList({
  klnr,
  items,
  page,
  hasMore,
}: {
  klnr: number;
  items: FactuurItem[];
  page: number;
  hasMore: boolean;
}) {
  const searchParams = useSearchParams();

  function pageHref(facturenPage: number): string {
    const query = new URLSearchParams(searchParams?.toString());
    query.set("facturenPage", String(facturenPage));
    return `/klanten/${klnr}?${query.toString()}`;
  }

  const footer =
    items.length === 0 ? null : (
      <div className="mt-4 flex items-center justify-end gap-2">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ChevronLeft />
            Vorige
          </Link>
        ) : (
          <span
            aria-disabled
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
          >
            <ChevronLeft />
            Vorige
          </span>
        )}
        {hasMore ? (
          <Link
            href={pageHref(page + 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Volgende
            <ChevronRight />
          </Link>
        ) : (
          <span
            aria-disabled
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
          >
            Volgende
            <ChevronRight />
          </span>
        )}
      </div>
    );

  return (
    <DataTablePanel title="Facturen" footer={footer}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen facturen gevonden voor deze klant.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facnr</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Totaal</TableHead>
              <TableHead>Vervaldatum</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.facnr}>
                <TableCell className="font-semibold">{item.facnr}</TableCell>
                <TableCell>{formatDatum(item.datum)}</TableCell>
                <TableCell>{formatBedrag(item.totaal)}</TableCell>
                <TableCell>{formatDatum(item.vervaldat)}</TableCell>
                <TableCell>{item.swBetaald ? "Betaald" : "Openstaand"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTablePanel>
  );
}

