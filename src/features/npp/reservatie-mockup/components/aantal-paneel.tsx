"use client";

import { Button } from "@/components/ui/button";
import type { MockOnderdeel } from "../types";

export function AantalPaneel({
  onderdeel,
  aantal,
  onAantalChange,
  onBevestig,
}: {
  onderdeel: MockOnderdeel;
  aantal: number;
  onAantalChange: (aantal: number) => void;
  onBevestig: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Neem benodigd aantal &middot; {onderdeel.artikelcode}
      </p>
      <div className="flex items-center gap-6">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="min-h-11 min-w-11"
          aria-label="Aantal verlagen"
          onClick={() => onAantalChange(Math.max(0, aantal - 1))}
        >
          -
        </Button>
        <span
          className="min-w-24 text-center font-heading text-6xl font-bold text-foreground"
          data-testid="aantal-waarde"
        >
          {aantal}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="min-h-11 min-w-11"
          aria-label="Aantal verhogen"
          onClick={() => onAantalChange(aantal + 1)}
        >
          +
        </Button>
      </div>
      <Button type="button" className="min-h-11 w-full" onClick={onBevestig}>
        Bevestigen
      </Button>
    </div>
  );
}
