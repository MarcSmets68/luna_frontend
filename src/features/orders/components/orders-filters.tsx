import { Input } from "@/components/ui/input";

export type OrdersFiltersState = {
  bonnr: string;
  naam: string;
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
    </div>
  );
}
