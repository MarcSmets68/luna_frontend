"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDatum } from "@/lib/format";
import { getArtlog, type ArtlogItem } from "@/lib/api-client";

const PAGE_SIZE = 25;

/**
 * FR-5: gepagineerde bewegingshistoriek ("Bewegingen"-tab). Lazy fetch bij
 * tab-activatie, eigen lokale paginatie binnen de tab (niet in de
 * hoofd-URL, zie architectuurontwerp §3.4). `beweging` wordt ruw/ongevertaald
 * getoond (BR-3, §3.6).
 */
export function ArtikelArtlogTab({ artnr }: { artnr: string }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ArtlogItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
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
        return getArtlog(artnr, { page, pageSize: PAGE_SIZE });
      })
      .then((result) => {
        if (cancelled || !result) return;
        setItems(result.items);
        setHasMore(result.hasMore);
      })
      .catch(() => {
        if (!cancelled) setError("Kon bewegingen niet ophalen.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artnr, page]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Bewegingen worden geladen...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen bewegingen gevonden.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Uur</TableHead>
                <TableHead>Beweging</TableHead>
                <TableHead>Aantal</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Klant/Leverancier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.artnr}-${item.lijnnr}`}>
                  <TableCell>{formatDatum(item.datum)}</TableCell>
                  <TableCell>{item.uur}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {item.beweging || "\u2014"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.aantal}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{item.docnr}</TableCell>
                  <TableCell className="whitespace-normal">{item.omschr}</TableCell>
                  <TableCell>{item.naam}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="mt-3 text-xs text-muted-foreground">
            Bewegingscodes zijn nog niet vertaald - betekenis wordt bevestigd door Marc.
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft />
              Vorige
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((current) => current + 1)}
            >
              Volgende
              <ChevronRight />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
