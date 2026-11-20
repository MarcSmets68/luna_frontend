import Form from "next/form";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { signalen, type laadAanvullingWerklijst } from "../lib/aanvulling-werklijst";

type WerklijstResultaat = Awaited<ReturnType<typeof laadAanvullingWerklijst>>;

export const AANVULLING_HREF = "/voorraad?weergave=aanvulling";

const signaalStijl: Record<keyof typeof signalen, string> = {
  dringend: "bg-error-bg text-error-fg",
  "onder-minimum": "bg-warning-bg text-warning-fg",
  "te-controleren": "bg-secondary text-secondary-foreground",
  "geen-signaal": "bg-muted text-muted-foreground",
};

function toonAantal(aantal: number | null) {
  return aantal !== null && Number.isFinite(aantal) ? aantal.toLocaleString("nl-BE") : "Onbekend";
}

function toonDatum(datum: string | null) {
  if (!datum) return "Onbekend";
  return (
    <time dateTime={datum}>
      {new Date(datum).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })}
    </time>
  );
}

function FilterSelect({ naam, label, waarde, opties }: {
  naam: string;
  label: string;
  waarde: string;
  opties: [string, string][];
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        name={naam}
        defaultValue={waarde}
        className="mt-1.5 block h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      >
        <option value="">Alle</option>
        {waarde && !opties.some(([optie]) => optie === waarde) && <option value={waarde}>{waarde}</option>}
        {opties.map(([optie, tekst]) => <option key={optie} value={optie}>{tekst}</option>)}
      </select>
    </label>
  );
}

export function AanvullingWerklijst({ resultaat }: { resultaat: WerklijstResultaat }) {
  const { filters } = resultaat;

  function paginalink(pagina: number) {
    const params = new URLSearchParams({ weergave: "aanvulling", page: String(pagina) });
    for (const [naam, waarde] of Object.entries(filters)) {
      if (waarde) params.set(naam, waarde);
    }
    return `/voorraad?${params}`;
  }

  if (resultaat.status === "niet-beschikbaar") {
    return (
      <div>
        <PageHeader section="Voorraad" title="Aanvulling nakijken" />
        <div role="alert" className="rounded-xl border border-error/30 bg-error-bg p-4 text-sm text-error-fg">
          <p className="font-semibold">Voorraadgegevens niet beschikbaar</p>
          <p className="mt-1">De werklijst kon niet worden geladen.</p>
          <Link href={paginalink(1)} prefetch={false} className="mt-2 inline-block underline">Opnieuw proberen</Link>
        </div>
      </div>
    );
  }

  const { artikelen, metadata, groepen, leveranciers, aantal, pagina, paginaAantal } = resultaat;
  const afgekapt = metadata.volledigheid === "afgekapt";
  const verouderd = metadata.actualiteit === "verouderd";

  return (
    <div>
      <PageHeader section="Voorraad" title="Aanvulling nakijken">
        <span>Peildatum: {toonDatum(metadata.peildatum)}</span>
      </PageHeader>

      <div className="mb-5 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm">
        {metadata.bron === "voorbeeld" && (
          <p><strong>Voorbeeldgegevens</strong> — geen live voorraad of levertoezeggingen.</p>
        )}
        <p className="text-muted-foreground">
          Intern beschikbaar = fysieke voorraad − interne reservaties. De filter ‘Alleen lage voorraad’ op de voorraadlijst kijkt alleen naar fysieke voorraad.
        </p>
        {metadata.actualiteit === "onbekend" && <p className="text-muted-foreground">Actualiteit van de bron: Onbekend.</p>}
      </div>
      {(afgekapt || verouderd) && (
        <div role="status" className="mb-5 rounded-xl border border-warning/30 bg-warning-bg p-4 text-sm text-warning-fg">
          {afgekapt && <p>Onvolledige werklijst: de bron heeft het resultaat afgekapt.</p>}
          {verouderd && <p>Verouderde voorraadgegevens: de getoonde waarden zijn niet actueel.</p>}
        </div>
      )}

      <div className="mb-5 rounded-xl border border-border bg-card p-4 shadow-(--shadow-surface)">
        <Form
          action="/voorraad"
          key={JSON.stringify(filters)}
          className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1.4fr_1fr_auto]"
        >
          <input type="hidden" name="weergave" value="aanvulling" />
          <label className="block text-sm font-medium">
            Zoek artikel
            <Input name="zoek" defaultValue={filters.zoek} placeholder="Artikelnummer of omschrijving" className="mt-1.5" />
          </label>
          <FilterSelect naam="groep" label="Artikelgroep" waarde={filters.groep} opties={groepen.map((groep) => [groep, groep])} />
          <FilterSelect naam="leverancier" label="Leverancier" waarde={filters.leverancier} opties={leveranciers.map((leverancier) => [leverancier, leverancier])} />
          <FilterSelect naam="urgentie" label="Urgentie" waarde={filters.urgentie} opties={Object.entries(signalen)} />
          <Button type="submit"><Search aria-hidden="true" />Zoeken</Button>
        </Form>
        {Object.values(filters).some(Boolean) && (
          <Link href={AANVULLING_HREF} className="mt-3 inline-block text-sm text-primary underline">Filters wissen</Link>
        )}
      </div>

      {aantal === 0 ? (
        <p className="text-sm text-muted-foreground">Geen artikelen gevonden in de beschikbare gegevens.</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">{aantal} {aantal === 1 ? "artikel" : "artikelen"} in dit resultaat</p>
          <Table mobileLabel="Aanvulling nakijken">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Artikel</TableHead>
                <TableHead scope="col">Signaal en reden</TableHead>
                <TableHead scope="col" mobileHidden className="text-right">Intern<br />fysiek</TableHead>
                <TableHead scope="col" mobileHidden className="text-right">Intern<br />gereserveerd</TableHead>
                <TableHead scope="col" mobileHidden className="text-right">Intern<br />minimum</TableHead>
                <TableHead scope="col" mobileHidden>Extern</TableHead>
                <TableHead scope="col" mobileHidden className="text-right">Open<br />inkoop</TableHead>
                <TableHead scope="col" mobileHidden>Eerstvolgende<br />bevestigde levering</TableHead>
                <TableHead scope="col" className="text-right">Intern<br />beschikbaar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artikelen.map((artikel) => (
                <TableRow key={artikel.artnr}>
                  <TableCell className="whitespace-normal">
                    <div className="font-semibold text-primary-600">{artikel.artnr}</div>
                    <div className="whitespace-normal">{artikel.omschrijvingNl}</div>
                    <div className="text-xs whitespace-normal text-muted-foreground">{artikel.groep || "Onbekend"} · {artikel.leverancier ?? "Onbekend"}</div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-semibold", signaalStijl[artikel.signaal])}>
                      {signalen[artikel.signaal]}
                    </span>
                    <div className="mt-1 text-xs text-muted-foreground">{artikel.reden}</div>
                  </TableCell>
                  <TableCell mobileHidden className="text-right">{toonAantal(artikel.voorraad)}</TableCell>
                  <TableCell mobileHidden className="text-right">{toonAantal(artikel.gereserveerd)}</TableCell>
                  <TableCell mobileHidden className="text-right">{toonAantal(artikel.voorraadMin)}</TableCell>
                  <TableCell mobileHidden>
                    <div>Aantal: {toonAantal(artikel.externAantal)}</div>
                    <div>Gereserveerd: {toonAantal(artikel.externGereserveerd)}</div>
                  </TableCell>
                  <TableCell mobileHidden className="text-right">{toonAantal(artikel.openInkoop)}</TableCell>
                  <TableCell mobileHidden>{toonDatum(artikel.bevestigdeLeverdatum)}</TableCell>
                  <TableCell className="text-right font-semibold">{toonAantal(artikel.beschikbaar)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {paginaAantal > 1 && (
            <nav aria-label="Paginering werklijst" className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <span className="text-sm text-muted-foreground">Pagina {pagina} van {paginaAantal}</span>
              {pagina > 1 && (
                <Link href={paginalink(pagina - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <ChevronLeft aria-hidden="true" /> Vorige
                </Link>
              )}
              {pagina < paginaAantal && (
                <Link href={paginalink(pagina + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Volgende <ChevronRight aria-hidden="true" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
