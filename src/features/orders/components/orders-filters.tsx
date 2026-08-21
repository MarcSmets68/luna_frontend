import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type GeparkeerdFilter = "" | "true" | "false";

// Sentinel select-value for "geen filter" - the underlying Select
// primitive doesn't support an empty-string item value (same reasoning as
// ALLE_BRONNEN/ALLE_LEVERANCIERS in lakproductie-filters.tsx), so this maps
// to/from GeparkeerdFilter's "" at the edges of this component only.
const GEPARKEERD_ALLE = "alle";

const GEPARKEERD_LABELS: Record<string, string> = {
  [GEPARKEERD_ALLE]: "Alle",
  true: "Enkel geparkeerd",
  false: "Niet geparkeerd",
};

export type OrdersFiltersState = {
  bonnr: string;
  naam: string;
  geparkeerd: GeparkeerdFilter;
};

/**
 * Filterbalk boven de orderlijst: filtert op Bonnr en Klant. Alle
 * filtering gebeurt server-side (zie GET /web/bon) - deze component is
 * enkel presentationeel, de aanroeper (OrdersPage) beslist wanneer/hoe een
 * wijziging naar de URL wordt geschreven.
 */
export function OrdersFilters({
  filters,
  onFiltersChange,
}: {
  filters: OrdersFiltersState;
  onFiltersChange: (filters: OrdersFiltersState) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="orders-filter-bonnr" className="text-[12px] text-muted-foreground">
          Bonnr
        </label>
        <Input
          id="orders-filter-bonnr"
          className="w-[140px]"
          placeholder="Bonnr."
          value={filters.bonnr}
          onChange={(e) => onFiltersChange({ ...filters, bonnr: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="orders-filter-naam" className="text-[12px] text-muted-foreground">
          Klant
        </label>
        <Input
          id="orders-filter-naam"
          className="w-[200px]"
          placeholder="Klant"
          value={filters.naam}
          onChange={(e) => onFiltersChange({ ...filters, naam: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="orders-filter-geparkeerd" className="text-[12px] text-muted-foreground">
          Geparkeerd
        </label>
        <Select
          value={filters.geparkeerd || GEPARKEERD_ALLE}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              geparkeerd: (value === GEPARKEERD_ALLE ? "" : value) as GeparkeerdFilter,
            })
          }
        >
          <SelectTrigger id="orders-filter-geparkeerd" className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GEPARKEERD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
