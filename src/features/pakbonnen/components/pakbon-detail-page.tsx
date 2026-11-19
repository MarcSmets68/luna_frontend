"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import { deletePakbon, getPakbon, getPaklijnen, updatePakbon, type PakbonItem, type PaklijnItem } from "@/lib/api-client";
import { PakbonAfhalenDialog } from "./pakbon-afhalen-dialog";
import { PaklijnTable } from "./paklijn-table";
import { PakbonEditDialog } from "./pakbon-edit-dialog";
import { PakbonNotFound } from "./pakbon-not-found";
import { downloadPakbonPdf } from "../lib/pakbon-pdf";

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
  const [editOpen, setEditOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const locked = current.afgehaald || current.facnr > 0;

  async function reload() {
    setReloading(true);
    setDeleteError(null);
    try {
      const kop = await getPakbon(current.paknr);
      if (!kop) { setMissing(true); return; }
      const rows = await getPaklijnen(current.paknr);
      setCurrent(kop);
      setLijnen(rows);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Vernieuwen van de pakbon mislukt.");
    } finally { setReloading(false); }
  }

  async function print() {
    setPrinting(true);
    setDeleteError(null);
    try {
      downloadPakbonPdf(current, lijnen);
      if (!current.afgedrukt) {
        try {
          await updatePakbon(current.paknr, { afgedrukt: true });
          setCurrent((prev) => ({ ...prev, afgedrukt: true }));
        } catch (e) {
          setDeleteError(`PDF aangemaakt, maar afdrukstatus opslaan mislukt: ${e instanceof Error ? e.message : "Onbekende fout"}`);
        }
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Afdrukken van de pakbon mislukt.");
    } finally { setPrinting(false); }
  }

  async function handleDelete() {
    if (locked) return;
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

  if (missing) return <PakbonNotFound paknr={String(current.paknr)} />;

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
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[26px] font-bold text-foreground">Pakbon {current.paknr}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">
            Klant{" "}
            <Link href={`/klanten/${current.klnr}`} className="underline">
              {current.naam}
            </Link>
          </div>
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={reloading}>{reloading ? "Bezig..." : "Vernieuwen"}</Button>
          <Button variant="outline" size="sm" onClick={() => void print()} disabled={printing}>Afdrukken</Button>
          {!locked && <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Bewerken</Button>}
          {!locked && (
            <Button type="button" variant="outline" size="sm" onClick={() => setAfhalenOpen(true)}>
              Afhalen
            </Button>
          )}
          {!locked && <Button type="button" variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Bezig..." : "Verwijderen"}
          </Button>}
        </div>
      </div>

      {deleteError && <p className="mb-4 text-sm text-destructive">{deleteError}</p>}
      {locked && <p role="status" className="mb-4 rounded-md border bg-muted p-3 text-sm">
        {current.afgehaald ? `Afgehaald op ${formatDatum(current.afgehaaldDatum)} door ${current.afgehaaldId} — niet meer bewerkbaar` : `Gefactureerd (factuur ${current.facnr}) — niet meer bewerkbaar`}
      </p>}

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
            <DetailField label="Levernaam" value={current.lnaam} />
            <DetailField label="Leverpostnr" value={current.lpostnr} />
            <DetailField label="Leverstad" value={current.lstad} />
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

      <PaklijnTable paknr={current.paknr} items={lijnen} onItemsChange={setLijnen} locked={locked} onReload={reload} />

      {editOpen && !locked && <PakbonEditDialog pakbon={current} onClose={() => setEditOpen(false)} onSaved={(updated) => { setCurrent(updated); setEditOpen(false); }} />}

      {!locked && <PakbonAfhalenDialog
        paknr={current.paknr}
        open={afhalenOpen}
        onOpenChange={setAfhalenOpen}
        onAfgehaald={(updated) => {
          setCurrent(updated);
          setAfhalenOpen(false);
          void reload();
        }}
      />}
    </div>
  );
}
