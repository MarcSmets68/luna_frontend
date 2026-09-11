import { DataTablePanel } from "@/components/ui/data-table-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KlantKortingItem } from "@/lib/api-client";

export function KlantKortingenList({ items }: { items: KlantKortingItem[] }) {
  return (
    <DataTablePanel title="Kortingen">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen kortingen gevonden voor deze klant.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artnr</TableHead>
              <TableHead>Artikelnaam</TableHead>
              <TableHead>Korting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.artnr}>
                <TableCell className="font-semibold">{item.artnr}</TableCell>
                <TableCell>{item.naam}</TableCell>
                <TableCell>{item.korting}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTablePanel>
  );
}

