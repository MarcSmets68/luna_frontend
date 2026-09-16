"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

type LijnFout = { omschrijving: string; error: string };

export function BonLijnFoutBanner({ bonnr }: { bonnr: number }) {
  const searchParams = useSearchParams();
  const [lijnFouten, setLijnFouten] = useState<LijnFout[]>([]);

  useEffect(() => {
    if (searchParams.get("lijnFout") !== "1") return;
    const key = `luna:bon-lijn-fout:${bonnr}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    sessionStorage.removeItem(key);
    try {
      const parsed = JSON.parse(raw) as { failed: LijnFout[] };
      // One-time read of a sessionStorage payload left by the create-flow
      // redirect, not a derived-state sync loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLijnFouten(parsed.failed ?? []);
    } catch {
      // ignore malformed sessionStorage payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (searchParams.get("lijnFout") !== "1") return null;
  if (lijnFouten.length === 0) return null;

  return (
    <Card className="mb-4 border-destructive">
      <CardContent>
        <p className="text-sm font-semibold text-destructive">
          Niet alle lijnen zijn opgeslagen.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-destructive">
          {lijnFouten.map((fout, index) => (
            <li key={index}>
              {fout.omschrijving}: {fout.error}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
