import type { VerkoopMaand } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GrowthBadge } from "@/features/omzetanalyse-dealers/components/growth-badge";
import { formatMoney, formatQty } from "@/features/omzetanalyse-dealers/lib/omzetanalyse-format";
import { groei, maandLabel, sommeer, vorigJaarLabel } from "../lib/verkoopsanalyse-model";

/** Month-by-month table: aantal and omzet, each next to last year's value and the growth. */
export function VerkoopsanalyseMaandTable({
  maanden,
  metAantal,
  eenheid,
}: {
  maanden: VerkoopMaand[];
  metAantal: boolean;
  eenheid?: string | null;
}) {
  const totaal = sommeer(maanden);
  const eenh = eenheid ? ` (${eenheid})` : "";

  const cells = (m: Omit<VerkoopMaand, "maand">) => (
    <>
      {metAantal && (
        <>
          <TableCell className="text-right tabular-nums">{formatQty(m.aantal)}</TableCell>
          <TableCell className="text-right text-muted-foreground tabular-nums">{formatQty(m.aantalVorigJaar)}</TableCell>
          <TableCell className="text-right">
            <GrowthBadge value={groei(m.aantal, m.aantalVorigJaar)} />
          </TableCell>
        </>
      )}
      <TableCell className="text-right tabular-nums">€ {formatMoney(m.omzet)}</TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">€ {formatMoney(m.omzetVorigJaar)}</TableCell>
      <TableCell className="text-right">
        <GrowthBadge value={groei(m.omzet, m.omzetVorigJaar)} />
      </TableCell>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Maand</TableHead>
            {metAantal && (
              <>
                <TableHead className="text-right">Aantal{eenh}</TableHead>
                <TableHead className="text-right">Vorig jaar</TableHead>
                <TableHead className="text-right">Groei</TableHead>
              </>
            )}
            <TableHead className="text-right">Omzet</TableHead>
            <TableHead className="text-right">Vorig jaar</TableHead>
            <TableHead className="text-right">Groei</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maanden.map((m) => (
            <TableRow key={m.maand}>
              <TableCell>
                {maandLabel(m.maand)}
                <span className="ml-1.5 text-[11px] text-muted-foreground">vs {vorigJaarLabel(m.maand)}</span>
              </TableCell>
              {cells(m)}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell>Totaal 12 maanden</TableCell>
            {cells(totaal)}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
