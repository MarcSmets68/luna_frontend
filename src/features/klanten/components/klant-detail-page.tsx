"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { KlantOffertesList } from "./klant-offertes-list";
import { KlantOrdersList } from "./klant-orders-list";
import {
  updateKlant,
  type BonItem,
  type KlantItem,
  type OfferteItem,
  type UpdateKlantPayload,
} from "@/lib/api-client";

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
    <div>
      <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 font-normal normal-case"
        />
      </label>
    </div>
  );
}

function EditTextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 font-normal normal-case"
          rows={3}
        />
      </label>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase border-b border-border pb-1.5">
        {title}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function GeblokkeerdField({
  editing,
  checked,
  onChange,
}: {
  editing: boolean;
  checked: boolean;
  onChange?: () => void;
}) {
  if (editing) {
    return (
      <div>
        <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Geblokkeerd
        </div>
        <label className="mt-1 flex h-8 items-center gap-2">
          <Checkbox checked={checked} onCheckedChange={onChange} aria-label="Geblokkeerd" />
          <span className="text-sm text-foreground">{checked ? "Ja" : "Nee"}</span>
        </label>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        Geblokkeerd
      </div>
      <label className="mt-1 flex h-8 items-center gap-2">
        <Checkbox checked={checked} disabled aria-label="Geblokkeerd" />
        <span className="text-sm text-foreground">{checked ? "Ja" : "Nee"}</span>
      </label>
    </div>
  );
}

// Bewerkbare velden op de klantkaart - `klnr` (identificatie, immutable
// primary key op de backend) en de offertes/orders-secties horen hier
// bewust niet bij.
type KlantFormState = {
  naam: string;
  naam1: string;
  contact: string;
  adres: string;
  postnr: string;
  stad: string;
  land: string;
  tel: string;
  fax: string;
  gsm: string;
  email: string;
  taal: string;
  munt: string;
  btwNr: string;
  saldo: string;
  geblokkeerd: boolean;
  opm: string;
};

function toFormState(klant: KlantItem): KlantFormState {
  return {
    naam: klant.naam,
    naam1: klant.naam1,
    contact: klant.contact,
    adres: klant.adres,
    postnr: klant.postnr,
    stad: klant.stad,
    land: klant.land,
    tel: klant.tel,
    fax: klant.fax,
    gsm: klant.gsm,
    email: klant.email,
    taal: klant.taal,
    munt: klant.munt,
    btwNr: klant.btwNr,
    saldo: String(klant.saldo),
    geblokkeerd: klant.geblokkeerd,
    opm: klant.opm,
  };
}

export function KlantDetailPage({
  klant,
  offertes,
  offertesPage,
  offertesHasMore,
  orders,
  ordersPage,
  ordersHasMore,
}: {
  klant: KlantItem;
  offertes: OfferteItem[];
  offertesPage: number;
  offertesHasMore: boolean;
  orders: BonItem[];
  ordersPage: number;
  ordersHasMore: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<KlantFormState>(() => toFormState(klant));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof KlantFormState>(key: K, value: KlantFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function startEditing() {
    setForm(toFormState(klant));
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(toFormState(klant));
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    const saldo = Number(form.saldo);
    if (Number.isNaN(saldo)) {
      setError("Saldo moet een geldig getal zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateKlantPayload = { ...form, saldo };
      await updateKlant(klant.klnr, payload);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de klantgegevens."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/klanten"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Klanten
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">{klant.naam}</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">Klantnr {klant.klnr}</div>
          {!editing && (
            <Button type="button" size="sm" onClick={startEditing}>
              Verbeteren
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent>
          {editing ? (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <FieldGroup title="Identiteit & adres">
                    <DetailField label="Klantnr" value={String(klant.klnr)} />
                    <EditField
                      label="Naam"
                      value={form.naam}
                      onChange={(v) => setField("naam", v)}
                    />
                    <EditField
                      label="Naam 1"
                      value={form.naam1}
                      onChange={(v) => setField("naam1", v)}
                    />
                    <EditField
                      label="Adres"
                      value={form.adres}
                      onChange={(v) => setField("adres", v)}
                    />
                    <EditField
                      label="Postnr"
                      value={form.postnr}
                      onChange={(v) => setField("postnr", v)}
                    />
                    <EditField
                      label="Stad"
                      value={form.stad}
                      onChange={(v) => setField("stad", v)}
                    />
                    <EditField
                      label="Land"
                      value={form.land}
                      onChange={(v) => setField("land", v)}
                    />
                  </FieldGroup>
                  <FieldGroup title="Commercieel">
                    <EditField
                      label="Taal"
                      value={form.taal}
                      onChange={(v) => setField("taal", v)}
                    />
                    <EditField
                      label="Munt"
                      value={form.munt}
                      onChange={(v) => setField("munt", v)}
                    />
                  </FieldGroup>
                </div>
                <div className="space-y-6">
                  <FieldGroup title="Contact">
                    <EditField
                      label="Contact"
                      value={form.contact}
                      onChange={(v) => setField("contact", v)}
                    />
                    <EditField
                      label="Telefoon"
                      value={form.tel}
                      onChange={(v) => setField("tel", v)}
                    />
                    <EditField label="Fax" value={form.fax} onChange={(v) => setField("fax", v)} />
                    <EditField label="GSM" value={form.gsm} onChange={(v) => setField("gsm", v)} />
                    <EditField
                      label="E-mail"
                      value={form.email}
                      onChange={(v) => setField("email", v)}
                      type="email"
                    />
                  </FieldGroup>
                  <FieldGroup title="Boekhouding">
                    <EditField
                      label="BTW-nr"
                      value={form.btwNr}
                      onChange={(v) => setField("btwNr", v)}
                    />
                    <EditField
                      label="Saldo"
                      value={form.saldo}
                      onChange={(v) => setField("saldo", v)}
                      type="number"
                    />
                    <GeblokkeerdField
                      editing
                      checked={form.geblokkeerd}
                      onChange={() => setField("geblokkeerd", !form.geblokkeerd)}
                    />
                  </FieldGroup>
                  <div className="space-y-4">
                    <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase border-b border-border pb-1.5">
                      Opmerking (intern)
                    </div>
                    <EditTextareaField
                      label="Opmerking"
                      value={form.opm}
                      onChange={(v) => setField("opm", v)}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancelEditing} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Bezig..." : "Save"}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <FieldGroup title="Identiteit & adres">
                  <DetailField label="Klantnr" value={String(klant.klnr)} />
                  <DetailField label="Naam" value={klant.naam} />
                  <DetailField label="Naam 1" value={klant.naam1} />
                  <DetailField label="Adres" value={klant.adres} />
                  <DetailField label="Postnr" value={klant.postnr} />
                  <DetailField label="Stad" value={klant.stad} />
                  <DetailField label="Land" value={klant.land} />
                </FieldGroup>
                <FieldGroup title="Commercieel">
                  <DetailField label="Taal" value={klant.taal} />
                  <DetailField label="Munt" value={klant.munt} />
                </FieldGroup>
              </div>
              <div className="space-y-6">
                <FieldGroup title="Contact">
                  <DetailField label="Contact" value={klant.contact} />
                  <DetailField label="Telefoon" value={klant.tel} />
                  <DetailField label="Fax" value={klant.fax} />
                  <DetailField label="GSM" value={klant.gsm} />
                  <DetailField label="E-mail" value={klant.email} />
                </FieldGroup>
                <FieldGroup title="Boekhouding">
                  <DetailField label="BTW-nr" value={klant.btwNr} />
                  <DetailField label="Saldo" value={formatSaldo(klant.saldo)} />
                  <GeblokkeerdField editing={false} checked={klant.geblokkeerd} />
                </FieldGroup>
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase border-b border-border pb-1.5">
                    Opmerking (intern)
                  </div>
                  <DetailField label="Opmerking" value={klant.opm} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KlantOffertesList
          klnr={klant.klnr}
          items={offertes}
          page={offertesPage}
          hasMore={offertesHasMore}
          ordersPage={ordersPage}
        />
        <KlantOrdersList
          klnr={klant.klnr}
          items={orders}
          page={ordersPage}
          hasMore={ordersHasMore}
          offertesPage={offertesPage}
        />
      </div>
    </div>
  );
}
