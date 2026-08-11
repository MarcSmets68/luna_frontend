import Link from "next/link";
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

export function KlantOffertesList({
  klnr,
  items,
  page,
  hasMore,
  ordersPage,
}: {
  klnr: number;
  items: OfferteItem[];
  page: number;
  hasMore: boolean;
  ordersPage: number;
}) {
  function pageHref(offertesPage: number): string {
    return `/klanten/${klnr}?offertesPage=${offertesPage}&ordersPage=${ordersPage}`;
  }

  return (
    <div>
      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Offertes</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen offertes gevonden voor deze klant.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offnr</TableHead>
                <TableHead>Versie</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Munt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.offnr}-${item.versie}`}>
                  <TableCell className="font-semibold">{item.offnr}</TableCell>
                  <TableCell>{item.versie}</TableCell>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell>{formatBedrag(item.bedrag)}</TableCell>
                  <TableCell>{item.munt}</TableCell>
                  <TableCell>{statusLabel(item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}
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
