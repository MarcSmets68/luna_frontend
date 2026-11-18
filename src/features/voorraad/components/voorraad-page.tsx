"use client";

import { PageHeader } from "@/components/ui/page-header";

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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ArtikelItem } from "@/lib/api-client";

function formatPrice(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function VoorraadPage({
  items,
  page,
  hasMore,
  lageVoorraad = false,
  toonGeblokkeerd = false,
}: {
  items: ArtikelItem[];
  page: number;
  hasMore: boolean;
  lageVoorraad?: boolean;
  toonGeblokkeerd?: boolean;
}) {
  const router = useRouter();
  const filterQuery =
    (lageVoorraad ? "&lageVoorraad=true" : "") +
    (toonGeblokkeerd ? "&toonGeblokkeerd=true" : "");

  function goToArtikel(artnr: string) {
    router.push(`/voorraad/${encodeURIComponent(artnr)}`);
  }

  function setToonGeblokkeerd(checked: boolean) {
    const params = new URLSearchParams();
    if (lageVoorraad) params.set("lageVoorraad", "true");
    if (checked) params.set("toonGeblokkeerd", "true");
    const query = params.toString();
    router.push(query ? `/voorraad?${query}` : "/voorraad");
  }

  return (
    <div>
      <PageHeader section="Voorraad" title={lageVoorraad ? "Artikelen — Lage voorraad" : "Artikelen"}>
          {lageVoorraad && (
            <Link href="/voorraad" className="text-[13px] text-primary underline">
              Filter wissen
            </Link>
          )}
        <span>Pagina {page}</span>
      </PageHeader>

      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-border bg-card p-4 shadow-(--shadow-surface)">
        <Checkbox
          checked={toonGeblokkeerd}
          onCheckedChange={setToonGeblokkeerd}
          aria-label="Ook geblokkeerde artikelen tonen"
        />
        <span className="text-sm text-foreground">Ook geblokkeerde artikelen tonen</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen artikelen gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artikel</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Groep</TableHead>
                <TableHead className="text-right">Verkoopprijs</TableHead>
                <TableHead className="text-right">Voorraad</TableHead>
                <TableHead className="text-right">Min.</TableHead>
                <TableHead className="text-right">Max.</TableHead>
                <TableHead>Geblokkeerd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.artnr}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open artikel ${item.artnr}`}
                  className="cursor-pointer focus:bg-muted/50 focus:outline-none"
                  onClick={() => goToArtikel(item.artnr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToArtikel(item.artnr);
                    }
                  }}
                >
                  <TableCell className="font-semibold text-primary-600">{item.artnr}</TableCell>
                  <TableCell className="whitespace-normal">{item.omschrijvingNl}</TableCell>
                  <TableCell>{item.groep}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(item.verkoopprijs)}</TableCell>
                  <TableCell className="text-right font-semibold">{item.voorraad}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.voorraadMin}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.voorraadMax}</TableCell>
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
                href={`/voorraad?page=${page - 1}${filterQuery}`}
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
                href={`/voorraad?page=${page + 1}${filterQuery}`}
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
