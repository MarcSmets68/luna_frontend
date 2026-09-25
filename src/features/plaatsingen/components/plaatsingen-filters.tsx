import { Input } from "@/components/ui/input";

export type PlaatsingenFiltersState = {
  planr: string;
  naam: string;
};

/**
 * Filterbalk boven de plaatsingenlijst: filtert op Planr en Klant. Enkel
 * presentationeel, net als `OffertesFilters` - de aanroeper
 * (PlaatsingenPage) beslist wanneer/hoe een wijziging naar de URL wordt
 * geschreven.
 */
export function PlaatsingenFilters({
  filters,
  onFiltersChange,
}: {
  filters: PlaatsingenFiltersState;
  onFiltersChange: (filters: PlaatsingenFiltersState) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="plaatsingen-filter-planr" className="text-[12px] text-muted-foreground">
          Planr
        </label>
        <Input
          id="plaatsingen-filter-planr"
          className="w-[140px]"
          placeholder="Planr."
          value={filters.planr}
          onChange={(e) => onFiltersChange({ ...filters, planr: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="plaatsingen-filter-naam" className="text-[12px] text-muted-foreground">
          Klant
        </label>
        <Input
          id="plaatsingen-filter-naam"
          className="w-[200px]"
          placeholder="Klant"
          value={filters.naam}
          onChange={(e) => onFiltersChange({ ...filters, naam: e.target.value })}
        />
      </div>
    </div>
  );
}
