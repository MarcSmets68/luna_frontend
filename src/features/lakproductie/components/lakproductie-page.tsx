import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LakproductieItem } from "@/lib/api-client";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupByBehandeling(items: LakproductieItem[]): Map<string, LakproductieItem[]> {
  const groups = new Map<string, LakproductieItem[]>();
  for (const item of items) {
    const key = item.behandeling || "Onbekend";
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function LakproductiePage({ items }: { items: LakproductieItem[] }) {
  const groups = groupByBehandeling(items);

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Productie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Lakproduktie</h1>
        <div className="text-[13px] text-[#5e5e5e]">{items.length} orderregels</div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen artikelen gevonden die nog gelakt of geanodiseerd moeten worden.
        </p>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([behandeling, groupItems]) => {
            // groepeerKleur is the same, derived value for every item in this
            // group (same behandeling text in -> same techniek/kleurkode/
            // afwerking out). It only differs from the raw behandeling code
            // when something could actually be derived from it - show it as
            // a simple "LAK/ANO · kleurkode · afwerking" badge next to the
            // title, and nothing when it couldn't be derived.
            const kleurLabel = groupItems[0].groepeerKleur;
            const hasKleurLabel = kleurLabel && kleurLabel !== behandeling;

            return (
              <div key={behandeling}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-[15px] font-semibold text-foreground">
                    {behandeling}
                    {hasKleurLabel && (
                      <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                        {kleurLabel}
                      </span>
                    )}
                  </h2>
                  <span className="text-[12px] text-[#5e5e5e]">
                    {groupItems.length} orderregel{groupItems.length === 1 ? "" : "s"}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Klant</TableHead>
                      <TableHead>Artikel</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Aantal</TableHead>
                      <TableHead>Behandeling</TableHead>
                      <TableHead>Orderdatum</TableHead>
                      <TableHead>Leverdatum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupItems.map((item, i) => (
                      <TableRow key={`${item.bonnr}-${item.artnr}-${i}`}>
                        <TableCell className="font-semibold">{item.bonnr}</TableCell>
                        <TableCell>{item.klant}</TableCell>
                        <TableCell>{item.artnr}</TableCell>
                        <TableCell className="whitespace-normal">{item.omschrijving}</TableCell>
                        <TableCell>{item.aantal}</TableCell>
                        <TableCell>{item.behandeling}</TableCell>
                        <TableCell>{formatDate(item.orderdatum)}</TableCell>
                        <TableCell>{formatDate(item.leverdatum)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
