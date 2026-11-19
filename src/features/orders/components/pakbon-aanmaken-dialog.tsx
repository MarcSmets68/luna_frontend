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
import { isTitleLine, TITLE_LINE_TEXT_CLASS } from "@/lib/line-classification";
import { Badge } from "@/components/ui/badge";
import {
  createPakbon,
  createPaklijn,
  deletePakbon,
  getBonLijnen,
  getKlant,
  ApiError,
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

export function leverbareLijnen(lijnen: BonLijnItem[]): BonLijnItem[] {
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
    geselecteerd: !lijn.hold,
    aantal: String(lijn.teLeveren),
  }));
}

export function buildPakbonPayload(
  bon: BonItem,
  paknr?: number,
  naam1 = ""
): CreatePakbonPayload {
  const leveradres = [bon.lnaam, bon.lnaam1, bon.ladres, bon.lpostnr, bon.lstad].some(
    (value) => value.trim()
  );
  return {
    ...(paknr === undefined ? {} : { paknr }),
    stempel: bon.stempel,
    datum: new Date().toISOString().slice(0, 10),
    klnr: bon.klnr,
    naam: bon.naam,
    naam1,
    adres: bon.adres,
    postnr: bon.postnr,
    stad: bon.stad,
    lnaam: leveradres ? bon.lnaam : bon.naam,
    ladres: leveradres ? bon.ladres : bon.adres,
    lpostnr: leveradres ? bon.lpostnr : bon.postnr,
    lstad: leveradres ? bon.lstad : bon.stad,
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

export function buildTitelPaklijnPayload(titelLijn: BonLijnItem): CreatePaklijnPayload {
  return {
    ...buildPaklijnPayload(titelLijn, 0),
    vprijs: 0,
    aprijs: 0,
    korting: 0,
    bedrag: 0,
  };
}

/**
 * Laat leverbare bonlijnen en aantallen kiezen, met optionele nummering.
 * Controleert de actuele te leveren aantallen voordat de kop wordt aangemaakt.
 * Voegt sectietitels en lijnen sequentieel toe; na een fout kunnen ontbrekende
 * lijnen op dezelfde pakbon opnieuw worden geprobeerd of kan de gebruiker sluiten.
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
  const [lijnErrors, setLijnErrors] = useState<Record<number, string>>({});
  const [createdPaknr, setCreatedPaknr] = useState<number | null>(null);
  const [pending, setPending] = useState<CreatePaklijnPayload[]>([]);
  const [succeeded, setSucceeded] = useState<number[]>([]);
  const [failedLijnnr, setFailedLijnnr] = useState<number | null>(null);
  const selectedLineCount = selectie.filter((s) => s.geselecteerd).length;
  const addedLineCount = selectie.filter((s) => succeeded.includes(s.lijn.lijnnr)).length;

  const visibleTitleNumbers = new Set<number>();
  let sectionTitle: BonLijnItem | undefined;
  for (const lijn of lijnen) {
    if (lijn.subtotaal || lijn.kolomtitel || lijn.infolijn) continue;
    if (isTitleLine(lijn.artnr)) {
      sectionTitle = lijn;
    } else if (sectionTitle && selectie.some((s) => s.lijn.lijnnr === lijn.lijnnr)) {
      visibleTitleNumbers.add(sectionTitle.lijnnr);
    }
  }

  function reset() {
    setError(null);
    setPaknr("");
    setSelectie(initialSelectie(lijnen));
    setLijnErrors({});
    setCreatedPaknr(null);
    setPending([]);
    setSucceeded([]);
    setFailedLijnnr(null);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return;
    if (!nextOpen) {
      close();
      return;
    }
    onOpenChange(nextOpen);
  }

  function handleClose() {
    handleOpenChange(false);
  }

  function handleOpenPakbon() {
    router.push(`/pakbonnen/${createdPaknr}`);
  }

  async function handleRetry() {
    if (createdPaknr === null) return;
    setSaving(true);
    setError(null);
    setFailedLijnnr(null);
    try {
      await postLijnen(createdPaknr, pending, succeeded);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEmpty() {
    if (createdPaknr === null) return;
    setSaving(true);
    try {
      await deletePakbon(createdPaknr);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verwijderen mislukt.");
    } finally {
      setSaving(false);
    }
  }

  function updateSelectie(lijnnr: number, patch: Partial<Omit<LijnSelectie, "lijn">>) {
    setSelectie((prev) =>
      prev.map((s) => (s.lijn.lijnnr === lijnnr ? { ...s, ...patch } : s))
    );
  }

  async function postLijnen(nummer: number, todo: CreatePaklijnPayload[], done: number[]) {
    const gelukt = [...done];
    for (let index = 0; index < todo.length; index++) {
      try {
        await createPaklijn(nummer, todo[index]);
        gelukt.push(todo[index].blijnnr);
        setSucceeded([...gelukt]);
        setPending(todo.slice(index + 1));
      } catch (e) {
        setPending(todo.slice(index));
        setFailedLijnnr(todo[index].blijnnr);
        setError(e instanceof Error ? e.message : "Lijn kon niet toegevoegd worden.");
        return;
      }
    }
    close();
    router.push(`/pakbonnen/${nummer}`);
  }

  function renderStatus(lijnnr: number) {
    if (createdPaknr === null) return null;
    if (succeeded.includes(lijnnr)) {
      return (
        <Badge variant="secondary">Toegevoegd</Badge>
      );
    }
    if (failedLijnnr === lijnnr) {
      return (
        <Badge variant="outline">Mislukt</Badge>
      );
    }
    if (pending.some((lijn) => lijn.blijnnr === lijnnr)) {
      return (
        <Badge variant="outline">Nog toe te voegen</Badge>
      );
    }
    return null;
  }

  async function handleConfirm() {
    const paknrValue = paknr.trim() ? Number(paknr) : undefined;
    if (paknrValue !== undefined && (!Number.isInteger(paknrValue) || paknrValue <= 0)) {
      setError("Vul een geldig paknr in (positief geheel getal).");
      return;
    }

    const gekozen = selectie.filter((s) => s.geselecteerd);
    if (gekozen.length === 0) {
      setError("Selecteer minstens één lijn.");
      return;
    }

    const errors: Record<number, string> = {};
    for (const s of gekozen) {
      const aantal = Number(s.aantal);
      if (!s.aantal.trim() || !Number.isInteger(aantal) || aantal <= 0) {
        errors[s.lijn.lijnnr] = `Lijn ${s.lijn.lijnnr}: vul een positief geheel aantal in.`;
      } else if (aantal > s.lijn.teLeveren) {
        errors[s.lijn.lijnnr] = `Lijn ${s.lijn.lijnnr}: aantal (${aantal}) mag niet groter zijn dan te leveren (${s.lijn.teLeveren}).`;
      }
    }
    setLijnErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError(null);
    try {
      const klant = await getKlant(bon.klnr).catch(() => null);
      const fresh = await getBonLijnen(bon.bonnr);
      const stale: Record<number, string> = {};
      for (const s of gekozen) {
        const current = fresh.find((lijn) => lijn.lijnnr === s.lijn.lijnnr);
        if (!current || current.teLeveren < Number(s.aantal)) {
          stale[s.lijn.lijnnr] = `Lijn ${s.lijn.lijnnr}: nog te leveren is ${current?.teLeveren ?? 0}. Pas het aantal aan.`;
        }
      }
      setSelectie((prev) =>
        prev.map((s) => ({
          ...s,
          lijn: {
            ...s.lijn,
            teLeveren: fresh.find((lijn) => lijn.lijnnr === s.lijn.lijnnr)?.teLeveren ?? 0,
          },
        }))
      );
      setLijnErrors(stale);
      if (Object.keys(stale).length) return;
      const todo: CreatePaklijnPayload[] = [];
      let title: BonLijnItem | undefined;
      for (const lijn of lijnen) {
        if (lijn.subtotaal || lijn.kolomtitel || lijn.infolijn) continue;
        if (isTitleLine(lijn.artnr)) {
          title = lijn;
          continue;
        }
        const selected = gekozen.find((s) => s.lijn.lijnnr === lijn.lijnnr);
        if (!selected) continue;
        if (title) {
          todo.push(buildTitelPaklijnPayload(title));
          title = undefined;
        }
        todo.push(buildPaklijnPayload(lijn, Number(selected.aantal)));
      }
      const created = await createPakbon(buildPakbonPayload(bon, paknrValue, klant?.naam1 ?? ""));
      setCreatedPaknr(created.paknr);
      setPending(todo);
      await postLijnen(created.paknr, todo, []);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de pakbon.";
      if (e instanceof ApiError && e.status === 409) {
        setError(
          paknrValue === undefined
            ? "Automatische nummering is mislukt: het pakbonnummer bestaat al. Probeer opnieuw of kies zelf een ander nummer."
            : `Pakbon ${paknrValue} bestaat al. Kies een ander nummer of laat het veld leeg.`
        );
      } else {
        setError(message);
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
            Bon {bon.bonnr} - {bon.naam}. Kies de lijnen die op deze pakbon komen.
          </DialogDescription>
        </DialogHeader>

        <label className="flex flex-col gap-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase shrink-0">
          Paknr
          <Input
            type="number"
            placeholder="Automatisch"
            step={1}
            disabled={saving || createdPaknr !== null}
            value={paknr}
            onChange={(e) => setPaknr(e.target.value)}
            className="mt-1 max-w-48 font-normal normal-case"
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Laat het paknr leeg voor automatische nummering.
        </p>

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
                {lijnen.map((row) => {
                  if (row.subtotaal || row.kolomtitel || row.infolijn) return null;
                  if (isTitleLine(row.artnr)) {
                    if (!visibleTitleNumbers.has(row.lijnnr)) return null;
                    return (
                      <TableRow key={row.lijnnr}>
                        <TableCell colSpan={6} className={TITLE_LINE_TEXT_CLASS}>
                          {row.omschrijving} {renderStatus(row.lijnnr)}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  const selected = selectie.find((s) => s.lijn.lijnnr === row.lijnnr);
                  if (!selected) return null;
                  const { lijn, geselecteerd, aantal } = selected;
                  return (
                    <TableRow key={lijn.lijnnr}>
                      <TableCell>
                        <Checkbox
                          checked={geselecteerd}
                          disabled={saving || createdPaknr !== null}
                          onCheckedChange={(checked) =>
                            updateSelectie(lijn.lijnnr, { geselecteerd: checked === true })
                          }
                          aria-label={`Lijn ${lijn.lijnnr} opnemen in pakbon`}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{lijn.lijnnr}</TableCell>
                      <TableCell>{lijn.artnr}</TableCell>
                      <TableCell className="whitespace-normal">
                        {lijn.omschrijving}
                        {lijn.hold && (
                          <Badge variant="outline" title="Lijn staat op hold" aria-label="Lijn staat op hold">
                            Hold
                          </Badge>
                        )}
                        {renderStatus(lijn.lijnnr)}
                      </TableCell>
                      <TableCell>{lijn.teLeveren}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          max={lijn.teLeveren}
                          value={aantal}
                          disabled={!geselecteerd || saving || createdPaknr !== null}
                          aria-invalid={!!lijnErrors[lijn.lijnnr]}
                          aria-describedby={lijnErrors[lijn.lijnnr] ? `lijn-error-${lijn.lijnnr}` : undefined}
                          aria-label={`Aantal voor lijn ${lijn.lijnnr}`}
                          onChange={(e) => updateSelectie(lijn.lijnnr, { aantal: e.target.value })}
                        />
                        {lijnErrors[lijn.lijnnr] && (
                          <p id={`lijn-error-${lijn.lijnnr}`} className="text-sm text-destructive">
                            {lijnErrors[lijn.lijnnr]}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {createdPaknr !== null && (
          <p className="text-sm shrink-0">
            Pakbon {createdPaknr} aangemaakt; {addedLineCount} van {selectedLineCount} lijnen toegevoegd.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive shrink-0">{error}</p>
        )}

        <DialogFooter className="shrink-0">
          {createdPaknr !== null && (
            <>
              <Button disabled={saving} onClick={handleRetry}>
                Ontbrekende lijnen opnieuw proberen
              </Button>
              {succeeded.length === 0 ? (
                <Button variant="outline" disabled={saving} onClick={handleDeleteEmpty}>
                  Lege pakbon verwijderen
                </Button>
              ) : (
                <Button disabled={saving} onClick={handleOpenPakbon}>
                  Pakbon openen
                </Button>
              )}
            </>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            {createdPaknr !== null ? "Sluiten" : "Annuleren"}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving || selectie.length === 0 || createdPaknr !== null}
          >
            {saving ? "Bezig..." : "Pakbon aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
