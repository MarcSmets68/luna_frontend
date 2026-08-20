import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BestelorderSortDir, BestelorderSortField } from "@/lib/api-client";

const SORT_FIELD_LABELS: Record<BestelorderSortField, string> = {
  ordnr: "Ordernr",
  datum: "Datum",
  naam: "Leverancier",
  stempel: "Status",
};

const SORT_DIR_LABELS: Record<BestelorderSortDir, string> = {
  asc: "Oplopend",
  desc: "Aflopend",
};

export type BestellingenFiltersState = {
  ordnr: string;
  naam: string;
  sortField: BestelorderSortField;
  sortDir: BestelorderSortDir;
};

/**
 * Filterbalk boven de bestellingenlijst: filtert op Ordernr en
 * Leverancier, en sorteert op Ordernr/Datum/Leverancier/Status in
 * oplopende of aflopende volgorde. Alle filtering/sortering gebeurt
 * server-side (zie GET /web/bestelorder) - deze component is enkel
 * presentationeel, de aanroeper (BestellingenPage) beslist wanneer/hoe
 * een wijziging naar de URL wordt geschreven.
 */
export function BestellingenFilters({
  filters,
  onFiltersChange,
}: {
  filters: BestellingenFiltersState;
  onFiltersChange: (filters: BestellingenFiltersState) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="bestellingen-filter-ordnr" className="text-[12px] text-muted-foreground">
          Ordernr
        </label>
        <Input
          id="bestellingen-filter-ordnr"
          className="w-[140px]"
          placeholder="Ordernr."
          value={filters.ordnr}
          onChange={(e) => onFiltersChange({ ...filters, ordnr: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bestellingen-filter-naam" className="text-[12px] text-muted-foreground">
          Leverancier
        </label>
        <Input
          id="bestellingen-filter-naam"
          className="w-[200px]"
          placeholder="Leverancier"
          value={filters.naam}
          onChange={(e) => onFiltersChange({ ...filters, naam: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bestellingen-sort-field" className="text-[12px] text-muted-foreground">
          Sorteren op
        </label>
        <Select
          value={filters.sortField}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              sortField: (value ?? "ordnr") as BestelorderSortField,
            })
          }
        >
          <SelectTrigger id="bestellingen-sort-field" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_FIELD_LABELS).map(([field, label]) => (
              <SelectItem key={field} value={field}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bestellingen-sort-dir" className="text-[12px] text-muted-foreground">
          Volgorde
        </label>
        <Select
          value={filters.sortDir}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              sortDir: (value ?? "desc") as BestelorderSortDir,
            })
          }
        >
          <SelectTrigger id="bestellingen-sort-dir" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_DIR_LABELS).map(([dir, label]) => (
              <SelectItem key={dir} value={dir}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
