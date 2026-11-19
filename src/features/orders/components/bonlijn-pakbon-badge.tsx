"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getBonLijnPakbonnen, type BonLijnPakbonRef } from "@/lib/api-client";

/**
 * Small reference block per bonlijn-rij, showing in which pakbon(nen) the
 * line is (partially) included. Lazily loaded on mount.
 */
export function BonlijnPakbonBadge({ bonnr, lijnnr }: { bonnr: number; lijnnr: number }) {
  const [refs, setRefs] = useState<BonLijnPakbonRef[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBonLijnPakbonnen(bonnr, lijnnr)
      .then((data) => {
        if (!cancelled) { setRefs(data); setFailed(false); }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [bonnr, lijnnr]);

  if (failed) return <Badge variant="outline" title="Pakbonnen konden niet geladen worden" aria-label="Pakbonnen konden niet geladen worden">?</Badge>;
  if (!refs || refs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {refs.map((ref) => (
        <Link key={ref.paknr} href={`/pakbonnen/${ref.paknr}`}>
          <Badge variant={ref.afgehaald ? "secondary" : "outline"}>Pakbon {ref.paknr}</Badge>
        </Link>
      ))}
    </div>
  );
}
