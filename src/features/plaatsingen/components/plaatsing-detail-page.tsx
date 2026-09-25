import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { PlaatsingItem } from "../types";
import { PlaatsingStatusBadge } from "./plaatsing-status-badge";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground whitespace-pre-line">{value || "\u2014"}</div>
    </div>
  );
}

export function PlaatsingDetailPage({ plaatsing }: { plaatsing: PlaatsingItem }) {
  return (
    <div>
      <Link
        href="/plaatsingen"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Plaatsingen
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[26px] font-bold text-foreground">Plaatsing {plaatsing.planr}</h1>
          <PlaatsingStatusBadge datumAfsluiting={plaatsing.datumAfsluiting} />
          {plaatsing.factuur && (
            <Badge variant="outline" className="text-[10.5px] font-medium">
              Factuur
            </Badge>
          )}
        </div>
        <div className="text-[13px] text-[#5e5e5e]">{formatDatum(plaatsing.datum)}</div>
      </div>

      {/* Basisgegevens */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Planr" value={String(plaatsing.planr)} />
            <DetailField label="Klant" value={`${plaatsing.klnr} - ${plaatsing.klantNaam}`} />
            <DetailField label="Technieker" value={`${plaatsing.vrtgw} - ${plaatsing.vrtgwNaam}`} />
            <DetailField label="Project" value={plaatsing.project ? String(plaatsing.project) : ""} />
            <DetailField label="Orderbevestiging" value={plaatsing.bonnr ? String(plaatsing.bonnr) : ""} />
            <DetailField label="Afsluitdatum" value={formatDatum(plaatsing.datumAfsluiting)} />
          </div>
        </CardContent>
      </Card>

      {/* Adres */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Adres
            </h2>
            <div className="flex flex-col gap-4">
              <DetailField label="Naam" value={plaatsing.naam} />
              <DetailField label="Naam (2)" value={plaatsing.naam1} />
              <DetailField label="Straat" value={plaatsing.adres} />
              <DetailField label="Postcode / stad" value={`${plaatsing.postnr} ${plaatsing.stad}`} />
              <DetailField label="Land" value={plaatsing.land} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Plaatsingsadres
            </h2>
            <div className="flex flex-col gap-4">
              <DetailField label="Naam" value={plaatsing.lnaam} />
              <DetailField label="Naam (2)" value={plaatsing.lnaam1} />
              <DetailField label="Straat" value={plaatsing.ladres} />
              <DetailField label="Postcode / stad" value={`${plaatsing.lpostnr} ${plaatsing.lstad}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Telefoon" value={plaatsing.telefoon} />
            <DetailField label="Gsm" value={plaatsing.gsm} />
            <DetailField label="Gsm (2)" value={plaatsing.gsm2} />
            <DetailField label="E-mail" value={plaatsing.email} />
            <DetailField label="E-mail (2)" value={plaatsing.email2} />
          </div>
        </CardContent>
      </Card>

      {/* Plaatsing */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Wijze" value={plaatsing.plaatsingswijze} />
            <DetailField label="Datum" value={formatDatum(plaatsing.plaatsingsdatum)} />
            <DetailField label="Prijs" value={formatBedrag(plaatsing.prijs)} />
            <DetailField label="Locatie" value={plaatsing.locatie} />
          </div>
        </CardContent>
      </Card>

      {/* Voorbereiding & opvolging */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <DetailField
              label={`Voorbereiding${plaatsing.swVoorbereiding ? " (aangevinkt)" : ""}`}
              value={plaatsing.voorbereiding}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <DetailField
              label={`Opvolging${plaatsing.swOpvolging ? " (aangevinkt)" : ""}`}
              value={plaatsing.opvolging}
            />
          </CardContent>
        </Card>
      </div>

      {/* Opmerking & facturatie */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <DetailField label="Opmerking" value={plaatsing.opm} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <DetailField label="Facturatie" value={plaatsing.facturatie} />
          </CardContent>
        </Card>
      </div>

      {/* Documentmappen */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Klassementmap" value={plaatsing.klassementmap} />
            <DetailField label="Werkbonmap" value={plaatsing.werkbonmap} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
