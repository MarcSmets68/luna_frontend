"use client";

import Link from "next/link";
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
import type { KlantItem } from "@/lib/api-client";

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function KlantenPage({
  items,
  page,
  hasMore,
}: {
  items: KlantItem[];
  page: number;
  hasMore: boolean;
}) {
  const router = useRouter();

  function goToKlant(klnr: number) {
    router.push(`/klanten/${klnr}`);
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Klanten
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Klanten</h1>
        <div className="text-[13px] text-[#5e5e5e]">Pagina {page}</div>
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
                <TableHead>Saldo</TableHead>
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
                  <TableCell className="font-semibold">{item.klnr}</TableCell>
                  <TableCell className="whitespace-normal">{item.naam}</TableCell>
                  <TableCell>{item.adres}</TableCell>
                  <TableCell>{item.postnr}</TableCell>
                  <TableCell>{item.stad}</TableCell>
                  <TableCell>{item.tel}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{formatSaldo(item.saldo)}</TableCell>
                  <TableCell>{item.geblokkeerd ? "Ja" : "Nee"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-end gap-2">
            {page > 1 ? (
              <Link
                href={`/klanten?page=${page - 1}`}
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
                href={`/klanten?page=${page + 1}`}
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
