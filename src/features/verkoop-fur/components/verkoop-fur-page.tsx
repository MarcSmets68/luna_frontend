import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VerkoopFurItem } from "@/lib/api-client";
import { VerkoopFurExportToolbar } from "./verkoop-fur-export-toolbar";
import { formatDate, formatStuks } from "../lib/verkoop-fur-format";

export function VerkoopFurPage({
  items,
  periodeVan,
  periodeTot,
}: {
  items: VerkoopFurItem[];
  periodeVan: string;
  periodeTot: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Rapportage
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Verkoop FUR</h1>
        <div className="flex items-center gap-4">
          <div className="text-[13px] text-muted-foreground">
            Periode: {formatDate(periodeVan)} t/m {formatDate(periodeTot)}
          </div>
          <VerkoopFurExportToolbar items={items} periodeVan={periodeVan} periodeTot={periodeTot} />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen dealers gevonden in deze periode
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Klnr</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Aantal FUR-orders</TableHead>
              <TableHead>Totaal aantal stuks</TableHead>
              <TableHead>Laatste besteldatum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.klnr}>
                <TableCell className="font-semibold">{item.klnr}</TableCell>
                <TableCell>{item.naam}</TableCell>
                <TableCell>{item.aantalFurOrders}</TableCell>
                <TableCell>{formatStuks(item.totaalAantalStuks)}</TableCell>
                <TableCell>{formatDate(item.laatsteBesteldatum)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
