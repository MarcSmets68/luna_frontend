"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ONBEKEND, type maakLakordersWerklijsten } from "../lakorder-werklijst";
import { BRON_LABELS, BronBadge } from "./bron-badge";

type Werklijsten = ReturnType<typeof maakLakordersWerklijsten>;
type Regel = Werklijsten["teBestellen"][number] | Werklijsten["besteld"][number];

const aantal = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 20 });

function Datum({ waarde, ontbreekt = ONBEKEND }: { waarde: string | null; ontbreekt?: string }) {
  if (!waarde) return ontbreekt;
  const [jaar, maand, dag] = waarde.split("-");
  return <time dateTime={waarde}>{dag}/{maand}/{jaar}</time>;
}

const filters = [
  { label: "Leverancier", leeg: "Alle leveranciers", waarde: (regel: Regel) => regel.leverancier ?? ONBEKEND },
  { label: "Kleur / techniek / afwerking", leeg: "Alle behandelingen", waarde: (regel: Regel) => regel.kleurTechniekAfwerking ?? ONBEKEND },
  { label: "Bronsoort", leeg: "Alle bronnen", waarde: (regel: Regel) => BRON_LABELS[regel.bron] },
  { label: "Opvolgstatus", leeg: "Alle statussen", waarde: (regel: Regel) => regel.status },
];

function Filter({
  label, leeg, opties, keuze, onChange,
}: {
  label: string;
  leeg: string;
  opties: string[];
  keuze: string;
  onChange: (waarde: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select
        value={keuze}
        items={[{ value: "", label: leeg }, ...opties.map((optie) => ({ value: optie, label: optie }))]}
        onValueChange={(waarde) => onChange(waarde ?? "")}
      >
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectItem value="">{leeg}</SelectItem>
          {opties.map((optie) => <SelectItem key={optie} value={optie}>{optie}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Werklijst({ regels, opvolgen }: { regels: Regel[]; opvolgen: boolean }) {
  const [keuzes, setKeuzes] = useState<Record<string, string>>({});
  const gefilterd = regels.filter((regel) =>
    filters.every(({ label, waarde }) => !keuzes[label] || keuzes[label] === waarde(regel)),
  );

  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filters.map(({ label, leeg, waarde }) => (
          <Filter
            key={label}
            label={label}
            leeg={leeg}
            opties={[...new Set(regels.map(waarde))].sort((a, b) => a.localeCompare(b, "nl-BE"))}
            keuze={keuzes[label] ?? ""}
            onChange={(keuze) => setKeuzes((vorige) => ({ ...vorige, [label]: keuze }))}
          />
        ))}
      </div>
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        {gefilterd.length} {gefilterd.length === 1 ? "regel" : "regels"}
      </p>
      {gefilterd.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {regels.length ? "Geen regels voor de gekozen filters." : "Geen regels in deze werklijst."}
        </p>
      ) : (
        <Table mobileLabel={opvolgen ? "Besteld, op te volgen" : "Te bestellen"}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Artikel</TableHead>
              <TableHead scope="col" mobileHidden>Bron / referentie</TableHead>
              <TableHead scope="col" mobileHidden>Leverancier</TableHead>
              <TableHead scope="col" mobileHidden>Behandeling</TableHead>
              <TableHead scope="col" mobileHidden className="text-right">Open saldo</TableHead>
              {opvolgen ? (
                <>
                  <TableHead scope="col" mobileHidden>Bestellingsdatum</TableHead>
                  <TableHead scope="col" mobileHidden aria-sort="ascending">Beloofde levering</TableHead>
                  <TableHead scope="col" mobileHidden>Externe stap</TableHead>
                </>
              ) : <TableHead scope="col" mobileHidden aria-sort="ascending">Productiedeadline</TableHead>}
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gefilterd.map((regel) => (
              <TableRow key={regel.id}>
                <TableCell>
                  <span className="font-medium text-foreground">{regel.artnr}</span>
                  <span className="block text-xs text-muted-foreground">{regel.omschrijving}</span>
                </TableCell>
                <TableCell mobileHidden>
                  <BronBadge bron={regel.bron} />
                  {regel.bron !== "min-max-voorraad" && (
                    <span className="mt-1 block text-xs text-muted-foreground">{regel.bronreferentie ?? ONBEKEND}</span>
                  )}
                </TableCell>
                <TableCell mobileHidden>{regel.leverancier ?? ONBEKEND}</TableCell>
                <TableCell mobileHidden className="whitespace-normal">
                  {regel.behandeling ?? ONBEKEND}
                  {regel.kleurTechniekAfwerking !== regel.behandeling && (
                    <span className="block text-xs text-muted-foreground">{regel.kleurTechniekAfwerking ?? ONBEKEND}</span>
                  )}
                </TableCell>
                <TableCell mobileHidden className="text-right">
                  {regel.openSaldo === null ? ONBEKEND : aantal.format(regel.openSaldo)}
                </TableCell>
                {"bestellingsdatum" in regel ? (
                  <>
                    <TableCell mobileHidden><Datum waarde={regel.bestellingsdatum} /></TableCell>
                    <TableCell mobileHidden>
                      <Datum waarde={regel.beloofdeLeverdatum} ontbreekt="Niet bevestigd" />
                    </TableCell>
                    <TableCell mobileHidden>{regel.externeStap ?? ONBEKEND}</TableCell>
                  </>
                ) : <TableCell mobileHidden><Datum waarde={regel.productiedeadline} /></TableCell>}
                <TableCell>
                  <Badge variant={regel.status === "Levering te laat" ? "destructive" : "outline"}>
                    {regel.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

export function LakorderWerklijst({ werklijsten }: { werklijsten: Werklijsten }) {
  return (
    <>
      <PageHeader section="Productie" title="Lakorders opvolgen">
        <Link href="/lakproduktie" className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Terug naar Lakproduktie
        </Link>
      </PageHeader>
      <p className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <span><strong className="font-semibold text-foreground">Proefweergave met testgegevens.</strong> Alleen-lezen, niet gekoppeld aan OpenEdge.</span>
      </p>
      <Tabs defaultValue="te-bestellen">
        <TabsList aria-label="Lakorders">
          <TabsTrigger value="te-bestellen">Te bestellen</TabsTrigger>
          <TabsTrigger value="besteld">Besteld, op te volgen</TabsTrigger>
        </TabsList>
        <TabsContent value="te-bestellen" keepMounted>
          <Werklijst regels={werklijsten.teBestellen} opvolgen={false} />
        </TabsContent>
        <TabsContent value="besteld" keepMounted>
          <Werklijst regels={werklijsten.besteld} opvolgen />
        </TabsContent>
      </Tabs>
    </>
  );
}
