"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/ui/field-group";
import { EntityDetailHeader } from "@/components/ui/entity-detail-header";
import { FlagGrid } from "@/components/ui/flag-grid";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum, statusLabel } from "@/lib/format";
import { isTitleLine, TITLE_LINE_TEXT_CLASS } from "@/lib/line-classification";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground">{value || "\u2014"}</div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid grid-cols-[140px_1fr] items-center gap-3">
      <span className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-normal normal-case"
      />
    </label>
  );
}

// Bewerkbare velden op de offertekaart - `klnr`/`offnr`/`versie`
// (identificatie, immutable) en `bedrag`/`btw` (server-berekend, niet op
// deze pagina herberekend) horen hier bewust niet bij.
type OfferteFormState = {
  datum: string;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  offgroep: string;
  soort: string;
  verkoopkans: string;
  uRef: string;
  besteldatum: string;
  verkochtdatum: string;
  opm: string;
  passief: boolean;
  verloren: boolean;
  verkocht: boolean;
};

function toFormState(offerte: OfferteItem): OfferteFormState {
  return {
    datum: offerte.datum ?? "",
    naam: offerte.naam,
    adres: offerte.adres,
    postnr: offerte.postnr,
    stad: offerte.stad,
    munt: offerte.munt,
    offgroep: offerte.offgroep,
    soort: offerte.soort,
    verkoopkans: String(offerte.verkoopkans),
    uRef: offerte.uRef,
    besteldatum: offerte.besteldatum ?? "",
    verkochtdatum: offerte.verkochtdatum ?? "",
    opm: offerte.opm,
    passief: offerte.passief,
    verloren: offerte.verloren,
    verkocht: offerte.verkocht,
  };
}

type LijnFout = { omschrijving: string; error: string };

export function OfferteDetailPage({
  offerte,
  lijnen,
}: {
  offerte: OfferteItem;
  lijnen: OfflijnItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OfferteFormState>(() => toFormState(offerte));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLijnen, setCurrentLijnen] = useState<OfflijnItem[]>(lijnen);
  const [lijnFouten, setLijnFouten] = useState<LijnFout[]>([]);

  useEffect(() => {
    if (searchParams.get("lijnFout") !== "1") return;
    const key = `luna:offerte-lijn-fout:${offerte.offnr}:${offerte.versie}`;
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

  const isDirty = useMemo(() => {
    const original = toFormState(offerte);
    return (Object.keys(original) as (keyof OfferteFormState)[]).some(
      (key) => original[key] !== form[key]
    );
  }, [offerte, form]);

  const setField = <K extends keyof OfferteFormState>(key: K, value: OfferteFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function startEditing() {
    setForm(toFormState(offerte));
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(toFormState(offerte));
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    const verkoopkans = Number(form.verkoopkans);
    if (Number.isNaN(verkoopkans)) {
      setError("Verkoopkans moet een geldig getal zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateOffertePayload = {
        datum: form.datum || undefined,
        naam: form.naam,
        adres: form.adres,
        postnr: form.postnr,
        stad: form.stad,
        munt: form.munt,
        offgroep: form.offgroep,
        soort: form.soort,
        verkoopkans,
        uRef: form.uRef,
        besteldatum: form.besteldatum || undefined,
        verkochtdatum: form.verkochtdatum || undefined,
        opm: form.opm,
        passief: form.passief,
        verloren: form.verloren,
        verkocht: form.verkocht,
      };
      await updateOfferte(offerte.offnr, offerte.versie, payload);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de offerte."
      );
    } finally {
      setSaving(false);
    }
  }

  const headerActions = editing ? (
    <>
      <Button type="button" variant="outline" onClick={cancelEditing} disabled={saving}>
        Cancel
      </Button>
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Bezig..." : "Save"}
      </Button>
    </>
  ) : (
    <Button type="button" size="sm" onClick={startEditing}>
      Verbeteren
    </Button>
  );

  return (
    <div>
      <Link
        href="/offertes/alle"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Offertes
      </div>

      <EntityDetailHeader
        title={`Offerte ${offerte.offnr}/${offerte.versie}`}
        subtitle={undefined}
        dirty={editing && isDirty}
        actions={headerActions}
      />

      <div className="mb-3 -mt-6 text-[13px] text-[#5e5e5e]">
        Klant{" "}
        <Link href={`/klanten/${offerte.klnr}`} className="underline">
          {offerte.naam}
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent>
          {editing ? (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <FieldGroup title="Algemeen">
                  <DetailField label="Offnr" value={String(offerte.offnr)} />
                  <DetailField label="Versie" value={String(offerte.versie)} />
                  <EditField label="Datum" value={form.datum} onChange={(v) => setField("datum", v)} type="date" />
                  <EditField label="Naam" value={form.naam} onChange={(v) => setField("naam", v)} />
                  <EditField label="Adres" value={form.adres} onChange={(v) => setField("adres", v)} />
                  <EditField label="Postnr" value={form.postnr} onChange={(v) => setField("postnr", v)} />
                  <EditField label="Stad" value={form.stad} onChange={(v) => setField("stad", v)} />
                  <EditField label="Munt" value={form.munt} onChange={(v) => setField("munt", v)} />
                </FieldGroup>

                <FieldGroup title="Commercieel">
                  <DetailField label="Bedrag" value={formatBedrag(offerte.bedrag)} />
                  <DetailField label="Btw" value={formatBedrag(offerte.btw)} />
                  <EditField
                    label="Offertegroep"
                    value={form.offgroep}
                    onChange={(v) => setField("offgroep", v)}
                  />
                  <EditField label="Soort" value={form.soort} onChange={(v) => setField("soort", v)} />
                  <EditField
                    label="Verkoopkans"
                    value={form.verkoopkans}
                    onChange={(v) => setField("verkoopkans", v)}
                    type="number"
                  />
                  <EditField label="Uw referentie" value={form.uRef} onChange={(v) => setField("uRef", v)} />
                  <EditField
                    label="Besteldatum"
                    value={form.besteldatum}
                    onChange={(v) => setField("besteldatum", v)}
                    type="date"
                  />
                  <EditField
                    label="Verkoopdatum"
                    value={form.verkochtdatum}
                    onChange={(v) => setField("verkochtdatum", v)}
                    type="date"
                  />
                  <EditField label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
                </FieldGroup>
              </div>

              <div className="mt-6">
                <FlagGrid
                  title="Kenmerken"
                  items={[
                    {
                      key: "passief",
                      label: "Passief",
                      checked: form.passief,
                      onToggle: () => setField("passief", !form.passief),
                    },
                    {
                      key: "verloren",
                      label: "Verloren",
                      checked: form.verloren,
                      onToggle: () => setField("verloren", !form.verloren),
                    },
                    {
                      key: "verkocht",
                      label: "Verkocht",
                      checked: form.verkocht,
                      onToggle: () => setField("verkocht", !form.verkocht),
                    },
                  ]}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Wordt bij opslaan automatisch uitgezet tenzij hier aangevinkt.
                </p>
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <FieldGroup title="Algemeen">
                  <DetailField label="Offnr" value={String(offerte.offnr)} />
                  <DetailField label="Versie" value={String(offerte.versie)} />
                  <DetailField label="Datum" value={formatDatum(offerte.datum)} />
                  <DetailField label="Naam" value={offerte.naam} />
                  <DetailField label="Adres" value={offerte.adres} />
                  <DetailField label="Postnr" value={offerte.postnr} />
                  <DetailField label="Stad" value={offerte.stad} />
                  <DetailField label="Munt" value={offerte.munt} />
                </FieldGroup>

                <FieldGroup title="Commercieel">
                  <DetailField label="Status" value={statusLabel(offerte)} />
                  <DetailField label="Bedrag" value={formatBedrag(offerte.bedrag)} />
                  <DetailField label="Btw" value={formatBedrag(offerte.btw)} />
                  <DetailField label="Offertegroep" value={offerte.offgroep} />
                  <DetailField label="Soort" value={offerte.soort} />
                  <DetailField label="Verkoopkans" value={String(offerte.verkoopkans)} />
                  <DetailField label="Uw referentie" value={offerte.uRef} />
                  <DetailField label="Besteldatum" value={formatDatum(offerte.besteldatum)} />
                  <DetailField label="Verkoopdatum" value={formatDatum(offerte.verkochtdatum)} />
                  <DetailField label="Opmerking" value={offerte.opm} />
                </FieldGroup>
              </div>

              <div className="mt-6">
                <FlagGrid
                  title="Kenmerken"
                  items={[
                    {
                      key: "passief",
                      label: "Passief",
                      checked: offerte.passief,
                      onToggle: () => {},
                      disabled: true,
                    },
                    {
                      key: "verloren",
                      label: "Verloren",
                      checked: offerte.verloren,
                      onToggle: () => {},
                      disabled: true,
                    },
                    {
                      key: "verkocht",
                      label: "Verkocht",
                      checked: offerte.verkocht,
                      onToggle: () => {},
                      disabled: true,
                    },
                  ]}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Lijnen</h2>

      {lijnen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen lijnen gevonden voor deze offerte.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Te leveren</TableHead>
              <TableHead>Vprijs</TableHead>
              <TableHead>Korting</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead>Aankoopprijs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/*
              NOTE: this table has no client-side totals/footer row today. If
              one is ever added, it must aggregate over
              `excludeTitleLines(lijnen)`, not raw `lijnen` - K00 rows are
              section-title placeholders, not real articles with real amounts.
            */}
            {lijnen.map((lijn) => {
              const isTitle = isTitleLine(lijn.artnr);
              if (isTitle) {
                return (
                  <TableRow key={lijn.lijnnr}>
                    <TableCell
                      colSpan={9}
                      className={cn("whitespace-normal", TITLE_LINE_TEXT_CLASS)}
                    >
                      {lijn.omschrijvingOfferte.trim() || lijn.omschrijving}
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={lijn.lijnnr}>
                  <TableCell className={cn("font-semibold", isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.lijnnr}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.artnr}
                  </TableCell>
                  <TableCell className={cn("whitespace-normal", isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.omschrijvingOfferte.trim() || lijn.omschrijving}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.aantal}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.teLeveren}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {formatBedrag(lijn.verkoopprijs)}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.korting}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {formatBedrag(lijn.bedrag)}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {formatBedrag(lijn.aankoopprijs)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <OfferteLijnenEditor
        mode="persisted"
        offnr={offerte.offnr}
        versie={offerte.versie}
        lijnen={currentLijnen}
        onLijnenChange={setCurrentLijnen}
      />
    </div>
  );
}
