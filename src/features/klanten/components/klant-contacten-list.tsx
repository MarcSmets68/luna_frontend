import { DataTablePanel } from "@/components/ui/data-table-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KlantContactItem } from "@/lib/api-client";

export function KlantContactenList({ items }: { items: KlantContactItem[] }) {
  return (
    <DataTablePanel title="Contactpersonen">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen contactpersonen gevonden voor deze klant.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Voornaam</TableHead>
              <TableHead>Tel</TableHead>
              <TableHead>GSM</TableHead>
              <TableHead>E-mail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.lijnnr}>
                <TableCell className="font-semibold">{item.naam}</TableCell>
                <TableCell>{item.voornaam}</TableCell>
                <TableCell>{item.tel}</TableCell>
                <TableCell>{item.gsm}</TableCell>
                <TableCell>{item.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTablePanel>
  );
}

