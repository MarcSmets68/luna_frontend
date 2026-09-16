"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  bonHerstelNaarDiagnose,
  bonHerstelOnderdelenBestellen,
  bonHerstelHersteld,
  type BonHerstelItem,
} from "@/lib/api-client";

/**
 * Transitie-knoppen voor de herstelworkflow. Elke knop is enkel enabled
 * bij het bijbehorende `stempel`; OND.BESTELD -> IN HERSTELLING gebeurt
 * automatisch server-side, dus daarvoor tonen we enkel een read-only
 * statusindicator zonder knop.
 */
export function HerstelStatusActions({
  bonnr,
  herstel,
  onUpdated,
}: {
  bonnr: number;
  herstel: BonHerstelItem;
  onUpdated: (updated: BonHerstelItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runTransition(action: () => Promise<BonHerstelItem>) {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      onUpdated(updated);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het bijwerken van de herstelstatus."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || herstel.stempel !== "ONTVANGST"}
          onClick={() => runTransition(() => bonHerstelNaarDiagnose(bonnr))}
        >
          Naar diagnose
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || herstel.stempel !== "DIAGNOSE"}
          onClick={() => runTransition(() => bonHerstelOnderdelenBestellen(bonnr))}
        >
          Onderdelen bestellen
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || herstel.stempel !== "IN HERSTELLING"}
          onClick={() => runTransition(() => bonHerstelHersteld(bonnr))}
        >
          Hersteld
        </Button>
        {herstel.stempel === "OND.BESTELD" && (
          <Badge variant="outline">Wacht op automatische overgang naar IN HERSTELLING</Badge>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
