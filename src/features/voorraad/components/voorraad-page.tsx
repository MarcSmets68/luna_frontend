"use client";

import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
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
import { withOverviewContext } from "@/lib/overview-navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ArtikelItem } from "@/lib/api-client";

type VoorraadFilters = {
  artnr: string;
  omschrijving: string;
  lageVoorraad: boolean;
  toonGeblokkeerd: boolean;
};

function formatPrice(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function VoorraadPage({
  items,
  page,
  hasMore,
  lageVoorraad = false,
  toonGeblokkeerd = false,
  artnr = "",
  omschrijving = "",
}: {
  items: ArtikelItem[];
  page: number;
  hasMore: boolean;
  lageVoorraad?: boolean;
  toonGeblokkeerd?: boolean;
  artnr?: string;
  omschrijving?: string;
}) {
  const router = useRouter();
  const hasFilters = Boolean(artnr || omschrijving || lageVoorraad || toonGeblokkeerd);

  function buildHref(targetPage?: number, changes: Partial<VoorraadFilters> = {}) {
    const values = { artnr, omschrijving, lageVoorraad, toonGeblokkeerd, ...changes };
    const params = new URLSearchParams();
    if (targetPage !== undefined) params.set("page", String(targetPage));
    if (values.lageVoorraad) params.set("lageVoorraad", "true");
    if (values.toonGeblokkeerd) params.set("toonGeblokkeerd", "true");
    if (values.artnr.trim()) params.set("artnr", values.artnr.trim());
    if (values.omschrijving.trim()) params.set("omschrijving", values.omschrijving.trim());
    return params.size ? `/voorraad?${params.toString()}` : "/voorraad";
  }

  function goToArtikel(artnr: string) {
    router.push(withOverviewContext(
      `/voorraad/${encodeURIComponent(artnr)}`,
      buildHref(page > 1 ? page : undefined),
      "/voorraad",
    ));
  }

  function setToonGeblokkeerd(checked: boolean) {
    router.push(buildHref(undefined, { toonGeblokkeerd: checked }));
  }

  return (
    <div>
      <PageHeader section="Voorraad" title={lageVoorraad ? "Artikelen — Lage voorraad" : "Artikelen"}>
        <span>Pagina {page}</span>
      </PageHeader>

      <div className="mb-5 rounded-xl border border-border bg-card p-4 shadow-(--shadow-surface)">
        <form
          key={JSON.stringify([artnr, omschrijving])}
          className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            router.push(buildHref(undefined, {
              artnr: String(data.get("artnr") ?? ""),
              omschrijving: String(data.get("omschrijving") ?? ""),
            }));
          }}
        >
          <label className="text-sm font-medium">
            Artikelnr
            <Input name="artnr" defaultValue={artnr} placeholder="Begint met…" className="mt-1.5" />
          </label>
          <label className="text-sm font-medium">
            Omschrijving
            <Input name="omschrijving" defaultValue={omschrijving} placeholder="Bevat…" className="mt-1.5" />
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit"><Search aria-hidden="true" />Zoeken</Button>
            {hasFilters && (
              <Link href="/voorraad" className="text-sm text-primary underline">Filters wissen</Link>
            )}
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={toonGeblokkeerd} onCheckedChange={setToonGeblokkeerd} />
            <span>Ook geblokkeerde artikelen tonen</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={lageVoorraad}
              onCheckedChange={(checked) => router.push(buildHref(undefined, { lageVoorraad: checked }))}
            />
            <span>Alleen lage voorraad</span>
          </label>
        </div>
        {(artnr || omschrijving) && <p className="mt-3 text-xs text-muted-foreground">Actieve zoekfilters: {[artnr && `artikelnr begint met “${artnr}”`, omschrijving && `omschrijving bevat “${omschrijving}”`].filter(Boolean).join(" · ")}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen artikelen gevonden.</p>
      ) : (
        <>
          <Table mobileLabel="Artikelen">
            <TableHeader>
              <TableRow>
                <TableHead>Artikel</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead mobileHidden>Groep</TableHead>
                <TableHead mobileHidden className="text-right">Verkoopprijs</TableHead>
                <TableHead className="text-right">Voorraad</TableHead>
                <TableHead mobileHidden className="text-right">Min.</TableHead>
                <TableHead mobileHidden className="text-right">Max.</TableHead>
                <TableHead mobileHidden>Geblokkeerd</TableHead>
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
                  <TableCell mobileHidden>{item.groep}</TableCell>
                  <TableCell mobileHidden className="text-right font-medium">{formatPrice(item.verkoopprijs)}</TableCell>
                  <TableCell className="text-right font-semibold">{item.voorraad}</TableCell>
                  <TableCell mobileHidden className="text-right text-muted-foreground">{item.voorraadMin}</TableCell>
                  <TableCell mobileHidden className="text-right text-muted-foreground">{item.voorraadMax}</TableCell>
                  <TableCell mobileHidden>
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
                href={buildHref(page - 1)}
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
                href={buildHref(page + 1)}
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
