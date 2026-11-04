import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MockOnderdeel } from "../types";
import { OnderdeelStatusBadge } from "./status-badge";

export function OnderdelenTabel({
  onderdelen,
  activeOnderdeelId,
}: {
  onderdelen: MockOnderdeel[];
  activeOnderdeelId: string | null;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Artikel</TableHead>
          <TableHead>Benodigd</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Locatie</TableHead>
          <TableHead>Uitstelbaar</TableHead>
          <TableHead>Batch/bin</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {onderdelen.map((o) => (
          <TableRow
            key={o.id}
            className={cn(o.id === activeOnderdeelId && "bg-accent/50")}
          >
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {o.artikelcode}
                </span>
                <span className="text-xs text-muted-foreground">
                  {o.omschrijving}
                </span>
              </div>
            </TableCell>
            <TableCell>{o.benodigd}</TableCell>
            <TableCell>{o.stock}</TableCell>
            <TableCell>{o.locatie}</TableCell>
            <TableCell>
              {o.uitstelbaar ? (
                <span className="text-xs text-muted-foreground">
                  Ja{o.montagestap ? ` (${o.montagestap})` : ""}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Nee</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-xs text-muted-foreground">
                {o.batch ?? "\u2013"}
              </span>
            </TableCell>
            <TableCell>
              <OnderdeelStatusBadge status={o.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
