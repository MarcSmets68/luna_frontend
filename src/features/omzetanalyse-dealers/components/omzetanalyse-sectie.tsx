import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OmzetPeriode, OmzetSectie } from "@/lib/api-client";
import { formatInteger, formatMoney, formatQty } from "../lib/omzetanalyse-format";
import { GrowthBadge } from "./growth-badge";
import { OmzetanalyseCategorieTable } from "./omzetanalyse-categorie-table";

type OmzetRow = {
  label: string;
  value: (p: OmzetPeriode | undefined) => string;
  growth: (p: OmzetPeriode | undefined) => number | null;
};

const OMZET_ROWS: OmzetRow[] = [
  { label: "Aantal orders", value: (p) => formatInteger(p?.aantalOrders ?? null), growth: (p) => p?.groeiAantalOrders ?? null },
  { label: "Omzet los", value: (p) => formatMoney(p?.omzetLos ?? null), growth: (p) => p?.groeiOmzetLos ?? null },
  { label: "Omzet productie", value: (p) => formatMoney(p?.omzetProductie ?? null), growth: (p) => p?.groeiOmzetProductie ?? null },
  { label: "Omzet totaal", value: (p) => formatMoney(p?.omzetTotaal ?? null), growth: (p) => p?.groeiOmzetTotaal ?? null },
];

function BlockHead({ labels }: { labels: string[] }) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead />
        {labels.map((l, i) => (
          <TableHead key={i} className="text-right">
            {l}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

export function OmzetanalyseSectie({
  sectie,
  kolomLabels,
  showGrowth,
}: {
  sectie: OmzetSectie;
  kolomLabels: string[];
  showGrowth: boolean;
}) {
  const metersRows = [
    { label: "Ledstrip / Nomatrack", values: sectie.meters.ledstripNomatrack },
    { label: "Cover met licht", values: sectie.meters.coverLicht },
  ];

  return (
    <section className="mb-12" data-testid="omzet-sectie">
      {sectie.dealerKlnr !== null && (
        <h2 className="mb-4 text-xl font-bold text-foreground">
          {sectie.dealerNaam} ({sectie.dealerKlnr})
        </h2>
      )}

      {sectie.categorieen.map((cat) => (
        <OmzetanalyseCategorieTable
          key={cat.categorie}
          categorie={cat}
          kolomLabels={kolomLabels}
          showGrowth={showGrowth}
        />
      ))}

      <h3 className="mb-2 text-[15px] font-semibold text-foreground">Omzet</h3>
      <Table className="mb-8">
        <BlockHead labels={kolomLabels} />
        <TableBody>
          {OMZET_ROWS.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium">{row.label}</TableCell>
              {kolomLabels.map((_, i) => (
                <TableCell key={i} className="text-right align-top">
                  <div>{row.value(sectie.omzet[i])}</div>
                  {showGrowth && <GrowthBadge value={row.growth(sectie.omzet[i])} />}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h3 className="mb-2 text-[15px] font-semibold text-foreground">Meters</h3>
      <Table>
        <BlockHead labels={kolomLabels} />
        <TableBody>
          {metersRows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium">{row.label}</TableCell>
              {kolomLabels.map((_, i) => (
                <TableCell key={i} className="text-right">
                  {formatQty(row.values[i] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
