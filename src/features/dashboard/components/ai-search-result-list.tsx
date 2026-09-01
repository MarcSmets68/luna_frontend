import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Generic result table for AI search - renders whichever columns are
 * present on the returned items (shape depends on `entity`, only known at
 * runtime), so this deliberately does not hardcode per-entity columns.
 * Column headers are the raw field names from the first item.
 */
export function AiSearchResultList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return null;

  const columns = Object.keys(items[0]);

  function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Ja" : "Nee";
    return String(value);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, i) => (
          <TableRow key={i}>
            {columns.map((column) => (
              <TableCell key={column}>{formatCell(item[column])}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
