/**
 * Order feature types
 * Ported from bestellingLak (shared/types.ts) — CSV-onafhankelijk datamodel
 */

// Treatment types
export type TreatmentType = "ANO" | "LAK" | "";

// Order status
export type OrderStatus = "nog te bestellen" | "Besteld" | "";

// Item type (Production vs Stock)
export type ItemType = "production" | "stock";

// Order item
export interface OrderItem {
  _index: number;
  bonnr: string;
  datum: string;
  klnr: string;
  klantnaam: string;
  lijnnr: number;
  artnr: string;
  omschrijving: string;
  kleursoort: string;
  kleurkode: string;
  afwerking: string;
  techniek: TreatmentType;
  aantal: number;
  gereserveerd: number;
  besteld: number;
  deadline: string;
  status: OrderStatus;
  lakLevnr: string;
  lakNaam: string;
  itemType: ItemType;
  maatBevestigd?: boolean;
  kleurBevestigd?: boolean;
  preproductie?: boolean;
  preproductieOK?: boolean;
  _isModified?: boolean;
  _isExcluded?: boolean;
  _originalBesteld?: number;
}

// Supplier definition
export interface Supplier {
  id: string;
  name: string;
  number: string;
  supportedTreatments: TreatmentType[];
}

// Color group key for batching
export interface ColorGroupKey {
  kleursoort: string;
  kleurkode: string;
  afwerking: string;
  techniek: TreatmentType;
}

// Order batch (grouped items)
export interface OrderBatch {
  colorKey: string;
  colorInfo: ColorGroupKey;
  items: OrderItem[];
  supplier: Supplier | null;
  totalQuantity: number;
  totalOrdered: number;
}

// Filter options
export interface FilterOptions {
  treatmentType?: TreatmentType;
  kleursoort?: string;
  kleurkode?: string;
  supplier?: string;
  status?: OrderStatus;
  itemType?: ItemType;
  searchQuery?: string;
  hideForecastBelowStock?: boolean;
}

// Sort options
export interface SortOptions {
  field: keyof OrderItem | "colorGroup";
  direction: "asc" | "desc";
}
