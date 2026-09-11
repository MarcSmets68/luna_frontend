import { DataTablePanel } from "@/components/ui/data-table-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KlantAdresItem } from "@/lib/api-client";

export function KlantAdressenList({ items }: { items: KlantAdresItem[] }) {
  return (
    <DataTablePanel title="Adressen">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen adressen gevonden voor deze klant.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Naam1</TableHead>
              <TableHead>Adres</TableHead>
              <TableHead>Postnr</TableHead>
              <TableHead>Stad</TableHead>
              <TableHead>Standaard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.lijnnr}>
                <TableCell className="font-semibold">{item.naam}</TableCell>
                <TableCell>{item.naam1}</TableCell>
                <TableCell>{item.adres}</TableCell>
                <TableCell>{item.postnr}</TableCell>
                <TableCell>{item.stad}</TableCell>
                <TableCell>{item.standaard ? "Ja" : "Nee"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTablePanel>
  );
}

