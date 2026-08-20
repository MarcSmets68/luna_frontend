import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LakproductieBron } from "@/lib/api-client";

const BRON_FILTER_LABELS: Record<LakproductieBron, string> = {
  "lopende-orders": "Order",
  "lopende-productielijnen": "Productielijn",
  "min-max-voorraad": "Min-max",
};

export const ALLE_BRONNEN = "alle-bronnen";
export const ALLE_LEVERANCIERS = "alle-leveranciers";

export type LakproductieFiltersState = {
  bron: LakproductieBron | typeof ALLE_BRONNEN;
  order: string;
  leverancier: string;
};

export const DEFAULT_LAKPRODUCTIE_FILTERS: LakproductieFiltersState = {
  bron: ALLE_BRONNEN,
  order: "",
  leverancier: ALLE_LEVERANCIERS,
};

/**
 * Filterbalk boven de lakproductie-lijst: filtert op bron, order en
 * leverancier. `leveranciers` is de lijst van distincte leveranciers over
 * alle (ongefilterde) orderregels, zodat de opties stabiel blijven ook als
 * een andere filter de zichtbare rijen al beperkt.
 */
export function LakproductieFilters({
  filters,
  onFiltersChange,
  leveranciers,
}: {
  filters: LakproductieFiltersState;
  onFiltersChange: (filters: LakproductieFiltersState) => void;
  leveranciers: string[];
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="lakproductie-filter-bron" className="text-[12px] text-muted-foreground">
          Bron
        </label>
        <Select
          value={filters.bron}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              bron: (value ?? ALLE_BRONNEN) as LakproductieFiltersState["bron"],
            })
          }
        >
          <SelectTrigger id="lakproductie-filter-bron" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALLE_BRONNEN}>Alle bronnen</SelectItem>
            {Object.entries(BRON_FILTER_LABELS).map(([bron, label]) => (
              <SelectItem key={bron} value={bron}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lakproductie-filter-order" className="text-[12px] text-muted-foreground">
          Order
        </label>
        <Input
          id="lakproductie-filter-order"
          className="w-[140px]"
          placeholder="Ordernr."
          value={filters.order}
          onChange={(e) => onFiltersChange({ ...filters, order: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="lakproductie-filter-leverancier"
          className="text-[12px] text-muted-foreground"
        >
          Leverancier
        </label>
        <Select
          value={filters.leverancier}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, leverancier: value ?? ALLE_LEVERANCIERS })
          }
        >
          <SelectTrigger id="lakproductie-filter-leverancier" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALLE_LEVERANCIERS}>Alle leveranciers</SelectItem>
            {leveranciers.map((leverancier) => (
              <SelectItem key={leverancier} value={leverancier}>
                {leverancier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
