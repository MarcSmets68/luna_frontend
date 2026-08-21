"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getArtikelBeschikbaarheid, type Beschikbaarheid } from "@/lib/api-client";

/**
 * FR-4: "Hoeveel kan ik nog bouwen?" - on-demand, lazy fetch bij tab-open
 * (nooit automatisch bij page-load, zie architectuurontwerp §3.4). Toont een
 * lege staat wanneer het artikel niet samengesteld is (`isSamengesteld =
 * false`, `componenten = []`) in plaats van "0 bouwbaar" (Randgeval uit
 * requirements-document).
 */
export function ArtikelBeschikbaarheidWidget({ artnr }: { artnr: string }) {
  const [data, setData] = useState<Beschikbaarheid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Reset via a microtask (not synchronously in the effect body) so the
    // fetch's loading/error state transitions happen asynchronously,
    // consistent with react-hooks/set-state-in-effect.
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setLoading(true);
        setError(null);
        return getArtikelBeschikbaarheid(artnr);
      })
      .then((result) => {
        if (!cancelled && result) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Kon beschikbaarheid niet ophalen.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artnr]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Beschikbaarheid wordt berekend...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data || !data.isSamengesteld) {
    return (
      <p className="text-sm text-muted-foreground">
        Dit is geen samengesteld artikel - er is geen stuklijst (BOM) om een
        beschikbaarheid voor te berekenen.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Bouwbare eenheden
        </div>
        <div className="text-2xl font-bold text-foreground">
          {data.bouwbareEenheden ?? "\u2014"}
        </div>
      </div>

      {data.componenten.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen componenten gevonden.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Benodigd/eenheid</TableHead>
              <TableHead>Voorraad component</TableHead>
              <TableHead>Bouwbaar uit component</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.componenten.map((component) => (
              <TableRow
                key={component.componentArtnr}
                className={cn(component.isBottleneck && "bg-destructive/10")}
              >
                <TableCell className="font-semibold">
                  {component.componentArtnr}
                  {component.isBottleneck && (
                    <Badge variant="destructive" className="ml-2">
                      Bottleneck
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {component.componentOmschrijving}
                </TableCell>
                <TableCell>{component.benodigdPerEenheid}</TableCell>
                <TableCell>{component.componentVoorraad}</TableCell>
                <TableCell>{component.bouwbaarUitDitComponent}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
