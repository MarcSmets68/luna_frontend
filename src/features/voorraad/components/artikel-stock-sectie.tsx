import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ArtikelItem } from "@/lib/api-client";

function StockField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground">{value || "\u2014"}</div>
    </div>
  );
}

function BeschikbaarField({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label={`Toelichting bij ${label}`}>
              <Info className="size-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Berekend op basis van de laatst bijgewerkte reservatie-teller, niet live
              herberekend vanuit openstaande orders. Kan tijdelijk afwijken van de werkelijke
              situatie.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

/**
 * FR-1: uitgebreide "Voorraad"-sectie op de detailpagina - toont de interne
 * en externe stock-velden, het berekende "beschikbaar"-veld (FR-3, met
 * drift-disclaimer via tooltip, zie architectuurontwerp §3.5) en "onder
 * minimum"-badges (FR-6: enkel wanneer `stock = true`, de backend geeft dit
 * al zo terug in `onderMinimumIntern`/`onderMinimumExtern`).
 */
export function ArtikelStockSectie({ artikel }: { artikel: ArtikelItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voorraadinformatie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {artikel.onderMinimumIntern && (
            <Badge variant="destructive">Onder minimum (intern)</Badge>
          )}
          {artikel.onderMinimumExtern && (
            <Badge variant="destructive">Onder minimum (extern)</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StockField label="Voorraad" value={String(artikel.voorraad)} />
          <StockField label="Min. voorraad" value={String(artikel.voorraadMin)} />
          <StockField label="Max. voorraad" value={String(artikel.voorraadMax)} />
          <StockField label="Gereserveerd" value={String(artikel.gereserveerd)} />
          <BeschikbaarField label="Beschikbaar" value={artikel.beschikbaar} />

          <StockField label="Voorraad extern" value={String(artikel.voorraadExtern)} />
          <StockField label="Min. voorraad extern" value={String(artikel.voorraadMinExtern)} />
          <StockField label="Max. voorraad extern" value={String(artikel.voorraadMaxExtern)} />
          <StockField label="In productie extern" value={String(artikel.gereserveerdExtern)} />
          <BeschikbaarField label="Beschikbaar extern" value={artikel.beschikbaarExtern} />

          <StockField label="Locatie" value={artikel.magazijn} />
          <StockField label="Externe voorraad" value={artikel.swExtern ? "Ja" : "Nee"} />
          <StockField label="Externe productie" value={artikel.swExProductie ? "Ja" : "Nee"} />
          <StockField label="Gewicht" value={String(artikel.gewicht)} />
        </div>
      </CardContent>
    </Card>
  );
}
