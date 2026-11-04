"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MockLijn } from "../types";
import { heeftOpenOnderdelen } from "../reducer";
import { LijnStatusBadge, OnderdeelStatusBadge } from "./status-badge";

export function ProductielijstTab({
  lijnen,
  onScanOpenOnderdeel,
  onAfronden,
}: {
  lijnen: MockLijn[];
  onScanOpenOnderdeel: (lijnId: string, onderdeelId: string) => void;
  onAfronden: (lijnId: string) => void;
}) {
  const productie = lijnen.filter(
    (l) => l.status === "gereed" || l.status === "afgerond",
  );

  if (productie.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nog geen bons in de productielijst.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {productie.map((lijn) => {
        // Only postponable ("open") parts reach production - a line with a
        // non-postponable shortage never leaves the reservatielijst.
        const openOnderdelen = lijn.onderdelen.filter(
          (o) => o.status === "open",
        );
        const geblokkeerd = heeftOpenOnderdelen(lijn);
        return (
          <li
            key={lijn.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-base font-medium text-foreground">
                Bon {lijn.bonnr} &middot; {lijn.armatuur} &times; {lijn.aantal}
              </span>
              <LijnStatusBadge status={lijn.status} />
            </div>

            {openOnderdelen.length > 0 && (
              <ul className="flex flex-col gap-2">
                {openOnderdelen.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {o.artikelcode} &middot; {o.omschrijving}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {o.verwachteLevering
                          ? `Verwacht: ${o.verwachteLevering}`
                          : "Wacht op materiaal"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <OnderdeelStatusBadge status={o.status} />
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-11"
                        onClick={() => onScanOpenOnderdeel(lijn.id, o.id)}
                      >
                        Scan en voeg toe
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-1">
              {geblokkeerd && (
                <p className="text-sm text-muted-foreground">
                  Eindcontrole geblokkeerd: er zijn nog open onderdelen.
                  Scan ze eerst om de reservatie te sluiten.
                </p>
              )}
              <Button
                type="button"
                className={cn("min-h-11 w-fit")}
                disabled={geblokkeerd || lijn.status === "afgerond"}
                onClick={() => onAfronden(lijn.id)}
              >
                {lijn.status === "afgerond" ? "Afgerond" : "Productie afronden"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
