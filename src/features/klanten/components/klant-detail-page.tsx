"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/ui/field-group";
import { EntityDetailHeader } from "@/components/ui/entity-detail-header";
import { FlagGrid } from "@/components/ui/flag-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { KlantOffertesList } from "./klant-offertes-list";
import { KlantOrdersList } from "./klant-orders-list";
import { KlantAdressenList } from "./klant-adressen-list";
import { KlantContactenList } from "./klant-contacten-list";
import { KlantFacturenList } from "./klant-facturen-list";
import { KlantKortingenList } from "./klant-kortingen-list";
import {
  updateKlant,
  type BonItem,
  type FactuurItem,
  type KlantAdresItem,
  type KlantContactItem,
  type KlantItem,
  type KlantKortingItem,
  type OfferteItem,
  type UpdateKlantPayload,
} from "@/lib/api-client";

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  adressen,
  contacten,
  kortingen,
  facturen,
  facturenPage,
  facturenHasMore,
}: {
  klant: KlantItem;
  offertes: OfferteItem[];
  offertesPage: number;
  offertesHasMore: boolean;
  orders: BonItem[];
  ordersPage: number;
  ordersHasMore: boolean;
  adressen: KlantAdresItem[];
  contacten: KlantContactItem[];
  kortingen: KlantKortingItem[];
  facturen: FactuurItem[];
  facturenPage: number;
  facturenHasMore: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("algemeen");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<KlantFormState>(() => toFormState(klant));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    const original = toFormState(klant);
    return (Object.keys(original) as (keyof KlantFormState)[]).some(
      (key) => original[key] !== form[key]
    );
  }, [klant, form]);

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
        href="/klanten"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Klanten
      </div>

      <EntityDetailHeader
        title={klant.naam}
        subtitle={`Klantnr ${klant.klnr}`}
        dirty={editing && isDirty}
        actions={headerActions}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
        <TabsList>
          <TabsTrigger value="algemeen">Algemeen</TabsTrigger>
          <TabsTrigger value="adressen">Adressen</TabsTrigger>
          <TabsTrigger value="contactpersonen">Contactpersonen</TabsTrigger>
          <TabsTrigger value="offertes">Offertes</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="financieel">Financieel</TabsTrigger>
          <TabsTrigger value="kortingen">Kortingen</TabsTrigger>
        </TabsList>

        <TabsContent value="algemeen">
          <Card>
            <CardContent>
              {editing ? (
                <>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FieldGroup title="Algemeen">
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
                        label="Contact"
                        value={form.contact}
                        onChange={(v) => setField("contact", v)}
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

                    <FieldGroup title="Contact & Financieel">
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
                      <EditField
                        label="Opmerking"
                        value={form.opm}
                        onChange={(v) => setField("opm", v)}
                      />
                    </FieldGroup>
                  </div>

                  <div className="mt-6">
                    <FlagGrid
                      title="Kenmerken"
                      items={[
                        {
                          key: "geblokkeerd",
                          label: "Geblokkeerd",
                          checked: form.geblokkeerd,
                          onToggle: () => setField("geblokkeerd", !form.geblokkeerd),
                        },
                      ]}
                    />
                  </div>

                  {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FieldGroup title="Algemeen">
                      <DetailField label="Klantnr" value={String(klant.klnr)} />
                      <DetailField label="Naam" value={klant.naam} />
                      <DetailField label="Naam 1" value={klant.naam1} />
                      <DetailField label="Contact" value={klant.contact} />
                      <DetailField label="Adres" value={klant.adres} />
                      <DetailField label="Postnr" value={klant.postnr} />
                      <DetailField label="Stad" value={klant.stad} />
                      <DetailField label="Land" value={klant.land} />
                    </FieldGroup>

                    <FieldGroup title="Contact & Financieel">
                      <DetailField label="Telefoon" value={klant.tel} />
                      <DetailField label="Fax" value={klant.fax} />
                      <DetailField label="GSM" value={klant.gsm} />
                      <DetailField label="E-mail" value={klant.email} />
                      <DetailField label="Taal" value={klant.taal} />
                      <DetailField label="Munt" value={klant.munt} />
                      <DetailField label="BTW-nr" value={klant.btwNr} />
                      <DetailField label="Saldo" value={formatSaldo(klant.saldo)} />
                      <DetailField label="Opmerking" value={klant.opm} />
                    </FieldGroup>
                  </div>

                  <div className="mt-6">
                    <FlagGrid
                      title="Kenmerken"
                      items={[
                        {
                          key: "geblokkeerd",
                          label: "Geblokkeerd",
                          checked: klant.geblokkeerd,
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
        </TabsContent>

        <TabsContent value="adressen">
          <KlantAdressenList items={adressen} />
        </TabsContent>

        <TabsContent value="contactpersonen">
          <KlantContactenList items={contacten} />
        </TabsContent>

        <TabsContent value="offertes">
          <KlantOffertesList
            klnr={klant.klnr}
            items={offertes}
            page={offertesPage}
            hasMore={offertesHasMore}
            ordersPage={ordersPage}
          />
        </TabsContent>

        <TabsContent value="orders">
          <KlantOrdersList
            klnr={klant.klnr}
            items={orders}
            page={ordersPage}
            hasMore={ordersHasMore}
            offertesPage={offertesPage}
          />
        </TabsContent>

        <TabsContent value="financieel">
          <KlantFacturenList
            klnr={klant.klnr}
            items={facturen}
            page={facturenPage}
            hasMore={facturenHasMore}
          />
        </TabsContent>

        <TabsContent value="kortingen">
          <KlantKortingenList items={kortingen} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
