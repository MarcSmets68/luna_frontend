// Pure mock types for the NPP "Reservatie van onderdelen" workflow mockup.
// No backend/API coupling - everything here is local UI state + fixtures.

export type OnderdeelStatus =
  | "te_scannen"
  | "gereserveerd"
  | "open"
  | "wacht_op_materiaal"
  | "gecorrigeerd";

export interface MockOnderdeel {
  id: string;
  artikelcode: string;
  omschrijving: string;
  benodigd: number;
  stock: number;
  locatie: string;
  uitstelbaar: boolean;
  montagestap?: string;
  status: OnderdeelStatus;
  genomenAantal?: number;
  batch?: string;
  verwachteLevering?: string;
  isLichtbronOfDriver?: boolean;
}

export type LijnStatus =
  | "te_reserveren"
  | "bezig"
  | "wacht_op_materiaal"
  | "gereed"
  | "afgerond";

export interface MockLijn {
  id: string;
  bonnr: number;
  armatuur: string;
  aantal: number;
  status: LijnStatus;
  bezigDoor?: string;
  onderdelen: MockOnderdeel[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  wie: string;
  wat: string;
}

export type CorrectieReden =
  | "verkeerde_boeking"
  | "verkeerde_locatie"
  | "verbruik_zonder_scan"
  | "verlies_breuk"
  | "andere";

export const CORRECTIE_REDENEN: { value: CorrectieReden; label: string }[] = [
  { value: "verkeerde_boeking", label: "Verkeerde boeking" },
  { value: "verkeerde_locatie", label: "Verkeerde locatie" },
  { value: "verbruik_zonder_scan", label: "Verbruik zonder scan" },
  { value: "verlies_breuk", label: "Verlies/breuk" },
  { value: "andere", label: "Andere" },
];

export const MAX_SCAN_POGINGEN = 3;
