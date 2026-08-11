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
import { formatBedrag, formatDatum } from "@/lib/format";
import type { BonItem } from "@/lib/api-client";

export function KlantOrdersList({
  klnr,
  items,
  page,
  hasMore,
  offertesPage,
}: {
  klnr: number;
  items: BonItem[];
  page: number;
  hasMore: boolean;
  offertesPage: number;
}) {
  function pageHref(ordersPage: number): string {
    return `/klanten/${klnr}?offertesPage=${offertesPage}&ordersPage=${ordersPage}`;
  }

  return (
    <div>
      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Orders</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen orders gevonden voor deze klant.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bonnr</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Munt</TableHead>
                <TableHead>Besteldatum</TableHead>
                <TableHead>Leverdatum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.bonnr}>
                  <TableCell className="font-semibold">{item.bonnr}</TableCell>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell>{formatBedrag(item.bedrag)}</TableCell>
                  <TableCell>{item.munt}</TableCell>
                  <TableCell>{formatDatum(item.besteldatum)}</TableCell>
                  <TableCell>{formatDatum(item.levDatum)}</TableCell>
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
