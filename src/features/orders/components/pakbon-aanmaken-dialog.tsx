"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { isTitleLine } from "@/lib/line-classification";
import {
  createPakbon,
  createPaklijn,
  type BonItem,
  type BonLijnItem,
  type CreatePakbonPayload,
  type CreatePaklijnPayload,
} from "@/lib/api-client";

type LijnSelectie = {
  lijn: BonLijnItem;
  geselecteerd: boolean;
  aantal: string;
};

function leverbareLijnen(lijnen: BonLijnItem[]): BonLijnItem[] {
  return lijnen.filter(
    (lijn) =>
      !isTitleLine(lijn.artnr) &&
      !lijn.subtotaal &&
      !lijn.kolomtitel &&
      !lijn.infolijn &&
      lijn.teLeveren > 0
  );
}

function initialSelectie(lijnen: BonLijnItem[]): LijnSelectie[] {
  return leverbareLijnen(lijnen).map((lijn) => ({
    lijn,
    geselecteerd: true,
    aantal: String(lijn.teLeveren),
  }));
}

export function buildPakbonPayload(bon: BonItem, paknr: number): CreatePakbonPayload {
  return {
    paknr,
    stempel: bon.stempel,
    datum: new Date().toISOString().slice(0, 10),
    klnr: bon.klnr,
    naam: bon.naam,
    adres: bon.adres,
    postnr: bon.postnr,
    stad: bon.stad,
    lnaam: bon.naam,
    ladres: bon.adres,
    lpostnr: bon.postnr,
    lstad: bon.stad,
    munt: bon.munt,
    uRef: bon.uRef,
    opm: bon.opm,
  };
}

export function buildPaklijnPayload(lijn: BonLijnItem, aantal: number): CreatePaklijnPayload {
  const bedrag = Math.round(aantal * lijn.vprijs * (1 - lijn.korting / 100) * 100) / 100;
  return {
    groepnr: lijn.groepnr,
    subgroepnr: lijn.subgroepnr,
    artnr: lijn.artnr,
    omschr: lijn.omschrijving,
    aantal,
    teLeveren: aantal,
    afgehaald: 0,
    vprijs: lijn.vprijs,
    aprijs: lijn.aprijs,
    korting: lijn.korting,
    btwKode: lijn.btwKode,
    bedrag,
    stempel: lijn.stempel,
    klnr: lijn.klnr,
    bonnr: lijn.bonnr,
    blijnnr: lijn.lijnnr,
    hold: lijn.hold,
    swLed: false,
    swSikta: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    opm: lijn.opm,
  };
}

/**
 * Maakt een pakbon aan vanuit een bon: de gebruiker kiest een paknr en
 * welke leverbare bonlijnen (met welk aantal) mee gaan. Het voorgestelde
 * aantal is `teLeveren`; meer dan dat wordt client-side geweigerd, de
 * server blijft de bron van waarheid. Kop en lijnen worden sequentieel
 * aangemaakt (POST /pakbon, dan POST /pakbon/{paknr}/lijn per lijn); een
 * fout bij een lijn stopt het proces en toont welke lijnen wél gelukt zijn.
 */
export function PakbonAanmakenDialog({
  bon,
  lijnen,
  open,
  onOpenChange,
}: {
  bon: BonItem;
  lijnen: BonLijnItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [paknr, setPaknr] = useState("");
  const [selectie, setSelectie] = useState<LijnSelectie[]>(() => initialSelectie(lijnen));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setPaknr("");
      setSelectie(initialSelectie(lijnen));
    }
    onOpenChange(nextOpen);
  }

  function updateSelectie(lijnnr: number, patch: Partial<Omit<LijnSelectie, "lijn">>) {
    setSelectie((prev) =>
      prev.map((s) => (s.lijn.lijnnr === lijnnr ? { ...s, ...patch } : s))
    );
  }

  async function handleConfirm() {
    const paknrValue = Number(paknr);
    if (!paknr.trim() || !Number.isInteger(paknrValue) || paknrValue <= 0) {
      setError("Vul een geldig paknr in (positief geheel getal).");
      return;
    }

    const gekozen = selectie.filter((s) => s.geselecteerd);
    if (gekozen.length === 0) {
      setError("Selecteer minstens één lijn.");
      return;
    }

    for (const s of gekozen) {
      const aantal = Number(s.aantal);
      if (!Number.isFinite(aantal) || aantal <= 0) {
        setError(`Lijn ${s.lijn.lijnnr}: vul een aantal groter dan 0 in.`);
        return;
      }
      if (aantal > s.lijn.teLeveren) {
        setError(
          `Lijn ${s.lijn.lijnnr}: aantal (${aantal}) mag niet groter zijn dan te leveren (${s.lijn.teLeveren}).`
        );
        return;
      }
    }

    setSaving(true);
    setError(null);
    const gelukt: number[] = [];
    let kopAangemaakt = false;
    try {
      const created = await createPakbon(buildPakbonPayload(bon, paknrValue));
      kopAangemaakt = true;
      for (const s of gekozen) {
        await createPaklijn(created.paknr, buildPaklijnPayload(s.lijn, Number(s.aantal)));
        gelukt.push(s.lijn.lijnnr);
      }
      handleOpenChange(false);
      router.push(`/pakbonnen/${created.paknr}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de pakbon.";
      if (!kopAangemaakt) {
        setError(message);
      } else if (gelukt.length > 0) {
        setError(
          `${message} Pakbon ${paknrValue} is aangemaakt met lijn(en) ${gelukt.join(", ")}; de overige lijnen zijn niet toegevoegd.`
        );
      } else {
        setError(
          `${message} Pakbon ${paknrValue} is aangemaakt maar bevat nog geen lijnen.`
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl flex max-h-[85vh] flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Pakbon aanmaken</DialogTitle>
          <DialogDescription>
            Bon {bon.bonnr} - {bon.naam}. Kies een paknr en de lijnen die op deze pakbon komen.
          </DialogDescription>
        </DialogHeader>

        <label className="flex flex-col gap-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase shrink-0">
          Paknr
          <Input
            type="number"
            value={paknr}
            onChange={(e) => setPaknr(e.target.value)}
            className="mt-1 max-w-48 font-normal normal-case"
          />
        </label>

        {selectie.length === 0 ? (
          <p className="text-sm text-muted-foreground shrink-0">
            Geen leverbare lijnen: alle lijnen van deze order zijn al volledig geleverd.
          </p>
        ) : (
          <div className="min-h-0 max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Lijnnr</TableHead>
                  <TableHead>Artnr</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Te leveren</TableHead>
                  <TableHead className="w-28">Aantal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectie.map(({ lijn, geselecteerd, aantal }) => (
                  <TableRow key={lijn.lijnnr}>
                    <TableCell>
                      <Checkbox
                        checked={geselecteerd}
                        onCheckedChange={(checked) =>
                          updateSelectie(lijn.lijnnr, { geselecteerd: checked === true })
                        }
                        aria-label={`Lijn ${lijn.lijnnr} opnemen in pakbon`}
                      />
                    </TableCell>
                    <TableCell className="font-semibold">{lijn.lijnnr}</TableCell>
                    <TableCell>{lijn.artnr}</TableCell>
                    <TableCell className="whitespace-normal">{lijn.omschrijving}</TableCell>
                    <TableCell>{lijn.teLeveren}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={lijn.teLeveren}
                        value={aantal}
                        disabled={!geselecteerd}
                        aria-label={`Aantal voor lijn ${lijn.lijnnr}`}
                        onChange={(e) => updateSelectie(lijn.lijnnr, { aantal: e.target.value })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {error && <p className="text-sm text-destructive shrink-0">{error}</p>}

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving || selectie.length === 0}
          >
            {saving ? "Bezig..." : "Pakbon aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
