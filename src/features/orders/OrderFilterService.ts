/**
 * OrderFilterService
 * Filter- en groepeerlogica voor OrderItem[]/OrderBatch[].
 * CSV-onafhankelijk: ported uit bestellingLak (CsvDataProvider.matchesFilters / getBatches / getFilteredItems).
 * Werkt op elke databron (API, mock, CSV) zolang de data naar OrderItem gemapt is.
 */

import type { FilterOptions, OrderBatch, OrderItem, Supplier, SortOptions, TreatmentType } from "./types";
import { buildColorKey } from "./grouping";

export class OrderFilterService {
  /**
   * Groepeer items in batches op basis van kleursoort|kleurkode|afwerking|techniek
   * @param items actieve (niet-uitgesloten) OrderItems
   * @param getSuppliersByTreatment resolver voor leveranciers per behandelingstype
   */
  static getBatches(
    items: OrderItem[],
    getSuppliersByTreatment: (treatment: TreatmentType) => Supplier[] = () => []
  ): OrderBatch[] {
    const grouped: Record<string, OrderItem[]> = {};

    for (const item of items) {
      const key = buildColorKey(item);
      (grouped[key] ??= []).push(item);
    }

    return Object.entries(grouped).map(([colorKey, groupItems]) => {
      const [kleursoort, kleurkode, afwerking, techniek] = colorKey.split("|");
      const suppliers = getSuppliersByTreatment(techniek as TreatmentType);

      return {
        colorKey,
        colorInfo: {
          kleursoort,
          kleurkode,
          afwerking,
          techniek: techniek as TreatmentType,
        },
        items: groupItems,
        supplier: suppliers[0] || null,
        totalQuantity: groupItems.reduce((sum, i) => sum + i.aantal, 0),
        totalOrdered: groupItems.reduce((sum, i) => sum + i.besteld, 0),
      };
    });
  }

  /**
   * Check of een item voldoet aan de opgegeven filters
   */
  static matchesFilters(item: OrderItem, filters: FilterOptions): boolean {
    if (filters.treatmentType && item.techniek !== filters.treatmentType) return false;
    if (filters.kleursoort && item.kleursoort !== filters.kleursoort) return false;
    if (filters.kleurkode && item.kleurkode !== filters.kleurkode) return false;
    if (filters.supplier && item.lakNaam !== filters.supplier) return false;
    if (filters.itemType && item.itemType !== filters.itemType) return false;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = `${item.omschrijving}|${item.artnr}|${item.bonnr}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    return true;
  }

  /**
   * Filter en (optioneel) sorteer items op item-niveau
   */
  static getFilteredItems(items: OrderItem[], filters: FilterOptions, sort?: SortOptions): OrderItem[] {
    const result = items.filter((item) => this.matchesFilters(item, filters));

    if (sort) {
      result.sort((a, b) => {
        const aVal = a[sort.field as keyof OrderItem] ?? "";
        const bVal = b[sort.field as keyof OrderItem] ?? "";
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sort.direction === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }

  /**
   * Filter batches op batch-niveau (bv. voor kaartenoverzicht)
   * kleurkode gebruikt hier "contains" i.p.v. exacte match, conform bestellingLak DataPage.tsx
   */
  static filterBatches(batches: OrderBatch[], filters: FilterOptions): OrderBatch[] {
    return batches.filter((batch) => {
      if (filters.treatmentType && batch.colorInfo.techniek !== filters.treatmentType) {
        return false;
      }

      if (
        filters.kleurkode &&
        !batch.colorInfo.kleurkode.toLowerCase().includes(filters.kleurkode.toLowerCase())
      ) {
        return false;
      }

      if (filters.supplier && batch.supplier?.name !== filters.supplier) {
        return false;
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const hasMatch = batch.items.some(
          (item) =>
            item.omschrijving?.toLowerCase().includes(query) ||
            item.artnr?.toLowerCase().includes(query) ||
            item.bonnr?.toLowerCase().includes(query)
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }
}
