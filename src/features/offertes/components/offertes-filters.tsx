import { Input } from "@/components/ui/input";

export type OffertesFiltersState = {
  offnr: string;
  naam: string;
};

/**
 * Filterbalk boven de offertelijst: filtert op Offnr en Klant. Alle
 * filtering gebeurt server-side (zie GET /web/offerte, offnr = prefix
 * match op het offertenummer, naam = substring match op de klantnaam)
 * - deze component is enkel presentationeel, de aanroeper (OffertesPage)
 * beslist wanneer/hoe een wijziging naar de URL wordt geschreven.
 */
export function OffertesFilters({
  filters,
  onFiltersChange,
}: {
  filters: OffertesFiltersState;
  onFiltersChange: (filters: OffertesFiltersState) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="offertes-filter-offnr" className="text-[12px] text-muted-foreground">
          Offnr
        </label>
        <Input
          id="offertes-filter-offnr"
          className="w-[140px]"
          placeholder="Offnr."
          value={filters.offnr}
          onChange={(e) => onFiltersChange({ ...filters, offnr: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="offertes-filter-naam" className="text-[12px] text-muted-foreground">
          Klant
        </label>
        <Input
          id="offertes-filter-naam"
          className="w-[200px]"
          placeholder="Klant"
          value={filters.naam}
          onChange={(e) => onFiltersChange({ ...filters, naam: e.target.value })}
        />
      </div>
    </div>
  );
}
