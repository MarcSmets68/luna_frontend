/**
 * Kleur-naar-hex mapping voor de kleurstip naast elke kleur/techniek/
 * afwerking-groep op de Lakproduktie-pagina.
 *
 * Geport uit de legacy CSV-tool (`bestellingLak/shared/constants.ts`,
 * RAL_COLORS + COLOR_MAP) - zelfde hex-waarden, zodat de kleurweergave
 * consistent blijft met wat gebruikers al kenden uit die tool.
 */

// Hex-waarden voor specifieke RAL-codes die in de praktijk voorkomen.
export const RAL_COLORS: Record<string, string> = {
  "9005": "#0a0a0a", // Jet Black
  "9016": "#f5f5f5", // Traffic White
  "9006": "#a8a8a8", // White Aluminium
  "9007": "#8f8f8f", // Grey Aluminium
  "3003": "#8b3a15", // Ruby Red
  "5015": "#002395", // Sky Blue
  "6005": "#0d3d0d", // Moss Green
  "7035": "#d5d5d5", // Light Grey
  "7016": "#383e42", // Anthracite Grey
  "1015": "#e6d2b5", // Light Ivory
  "2004": "#e75b12", // Pure Orange
  "7001": "#8f999f", // Silver Grey (gebruikt door EnrichKleurInfo als grijs-fallback)
};

// Fallback op kleurnaam (kleurkode of kleursoort) voor niet-RAL kleuren,
// zoals de ANO-kleuren (TITANIUM, GOUD, BRONS, ZWART, GRIJS, ...).
export const COLOR_MAP: Record<string, string> = {
  ROOD: "#DC2626",
  BLAUW: "#2563EB",
  GROEN: "#16A34A",
  GEEL: "#EAB308",
  WIT: "#F5F5F5",
  ZWART: "#1F2937",
  GRIJS: "#6B7280",
  ZILVER: "#D1D5DB",
  GOUD: "#D97706",
  BRUIN: "#92400E",
  ORANJE: "#EA580C",
  ROZE: "#EC4899",
  PAARS: "#A855F7",
  BRONS: "#B8860B",
  BRONZE: "#B8860B",
  TITANIUM: "#C0C0C0",
};

const FALLBACK_COLOR = "#9CA3AF";

/**
 * Bepaalt de hex-kleur om te tonen voor een gegeven kleursoort/kleurkode-
 * combinatie: RAL-code eerst, dan kleurkode/kleursoort-naam, anders grijze
 * fallback. Lege input (niets kon afgeleid worden uit de behandeling) geeft
 * ook de fallback-kleur terug.
 */
export function getColorHex(kleursoort: string, kleurkode: string): string {
  if (kleursoort === "RAL" && RAL_COLORS[kleurkode]) {
    return RAL_COLORS[kleurkode];
  }
  return (
    COLOR_MAP[kleurkode.toUpperCase()] ??
    COLOR_MAP[kleursoort.toUpperCase()] ??
    FALLBACK_COLOR
  );
}
