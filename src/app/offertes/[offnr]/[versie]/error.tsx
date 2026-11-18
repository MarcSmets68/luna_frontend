"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfferteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-[26px] font-bold text-foreground">Offerte laden mislukt</h1>
      <Card>
        <CardContent>
          <p role="alert" className="mb-4 text-sm text-destructive">
            De offerte kon niet worden geladen. Probeer het opnieuw.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={retry}>Opnieuw proberen</Button>
            <Link href="/offertes/alle" className="text-sm underline">Terug naar overzicht</Link>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
