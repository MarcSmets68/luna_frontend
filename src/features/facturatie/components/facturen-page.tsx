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
import type { FactuurItem } from "@/lib/api-client";

function betaaldLabel(item: FactuurItem): string {
  return item.swBetaald ? "Betaald" : "Openstaand";
}

export function FacturenPage({
  items,
  page,
  hasMore,
}: {
  items: FactuurItem[];
  page: number;
  hasMore: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Facturatie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Alle facturen</h1>
        <div className="text-[13px] text-[#5e5e5e]">Pagina {page}</div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen facturen gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factuurnr</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Vervaldatum</TableHead>
                <TableHead>Betaald</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.facnr} className="cursor-pointer">
                  <TableCell className="font-semibold">
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {item.facnr}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {formatDatum(item.datum)}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {item.naam}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {item.stad}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {formatBedrag(item.totaal)} {item.munt}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {formatDatum(item.vervaldat)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/facturatie/${item.facnr}`} className="block">
                      {betaaldLabel(item)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-end gap-2">
            {page > 1 ? (
              <Link
                href={`/facturatie/alle?page=${page - 1}`}
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
                href={`/facturatie/alle?page=${page + 1}`}
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
