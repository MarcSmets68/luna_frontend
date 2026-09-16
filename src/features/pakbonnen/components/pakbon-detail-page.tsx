"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import { deletePakbon, type PakbonItem, type PaklijnItem } from "@/lib/api-client";
import { PakbonAfhalenDialog } from "./pakbon-afhalen-dialog";
import { PaklijnTable } from "./paklijn-table";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground">{value || "\u2014"}</div>
    </div>
  );
}

export function PakbonDetailPage({
  pakbon,
  paklijnen,
}: {
  pakbon: PakbonItem;
  paklijnen: PaklijnItem[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(pakbon);
  const [lijnen, setLijnen] = useState(paklijnen);
  const [afhalenOpen, setAfhalenOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Pakbon ${current.paknr} verwijderen?`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePakbon(current.paknr);
      router.push("/pakbonnen");
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de pakbon."
      );
      setDeleting(false);
    }
  }

  return (
    <div>
      <Link
        href="/pakbonnen"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Pakbonnen
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Pakbon {current.paknr}</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">
            Klant{" "}
            <Link href={`/klanten/${current.klnr}`} className="underline">
              {current.naam}
            </Link>
          </div>
          {!current.afgehaald && (
            <Button type="button" variant="outline" size="sm" onClick={() => setAfhalenOpen(true)}>
              Afhalen
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Bezig..." : "Verwijderen"}
          </Button>
        </div>
      </div>

      {deleteError && <p className="mb-4 text-sm text-destructive">{deleteError}</p>}

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Paknr" value={String(current.paknr)} />
            <DetailField label="Stempel" value={current.stempel} />
            <DetailField label="Datum" value={formatDatum(current.datum)} />
            <DetailField label="Klant" value={current.naam} />
            <DetailField label="Adres" value={current.adres} />
            <DetailField label="Postnr" value={current.postnr} />
            <DetailField label="Stad" value={current.stad} />
            <DetailField label="Leveradres" value={current.ladres} />
            <DetailField label="Munt" value={current.munt} />
            <DetailField label="Bedrag" value={formatBedrag(current.nBedrag)} />
            <DetailField label="Btw" value={formatBedrag(current.totBtw)} />
            <DetailField label="Uw referentie" value={current.uRef} />
            <DetailField label="Facnr" value={String(current.facnr)} />
            <DetailField label="Projectnr" value={String(current.projectnr)} />
            <DetailField label="Afgedrukt" value={current.afgedrukt ? "Ja" : "Nee"} />
            <DetailField label="Afgehaald" value={current.afgehaald ? "Ja" : "Nee"} />
            <DetailField label="Afgehaald door" value={current.afgehaaldId} />
            <DetailField label="Afgehaald datum" value={formatDatum(current.afgehaaldDatum)} />
            <DetailField label="Compleet" value={current.compleet ? "Ja" : "Nee"} />
            <DetailField label="Tracknr" value={current.tracknr} />
            <DetailField label="Verzending" value={current.verzending} />
            <DetailField label="Opmerking" value={current.opm} />
          </div>
        </CardContent>
      </Card>

      <PaklijnTable paknr={current.paknr} items={lijnen} onItemsChange={setLijnen} />

      <PakbonAfhalenDialog
        paknr={current.paknr}
        open={afhalenOpen}
        onOpenChange={setAfhalenOpen}
        onAfgehaald={(updated) => {
          setCurrent(updated);
          setAfhalenOpen(false);
        }}
      />
    </div>
  );
}
