import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DevUserItem } from "@/lib/api-client";

/** Placeholder for empty kode/naam values coming back from the backend. */
const EMPTY_PLACEHOLDER = "\u2014";

export function DevUsersPage({ items }: { items: DevUserItem[] }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Dev
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Users (dev)</h1>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen users gevonden.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.kode || "dev-user-" + index}>
                <TableCell className="font-semibold">
                  {item.kode || EMPTY_PLACEHOLDER}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {item.naam || EMPTY_PLACEHOLDER}
                </TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.niveau}</TableCell>
                <TableCell>{item.passief ? "Inactive" : "Active"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

