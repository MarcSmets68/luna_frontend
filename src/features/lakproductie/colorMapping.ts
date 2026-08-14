/**
 * Axalta-mapping voor interne "RAL n"-kleurcodes.
 *
 * Let op: ondanks de naam zijn dit GEEN echte RAL-kleuren - "RAL 1", "RAL 2",
 * ... zijn interne codes die in het verleden ongelukkig als "RAL <nummer>"
 * benoemd zijn. Bevestigd met Marc (2026-08-13). Ze komen boven op de echte
 * RAL-kleuren (RAL 9005, RAL 9016, ...) die door `EnrichKleurInfo`/
 * `ExtractRalKleurkode` al correct als 4-cijferige RAL-code herkend worden -
 * deze mapping is puur voor de losstaande "RAL 1".."RAL 5"-reeks.
 *
 * Geport uit de legacy CSV-tool (`bestellingLak/shared/colorMapping.ts`),
 * met de placeholder-data (die tool had enkel "RAL 1".."RAL 4" en die codes
 * kwamen niet overeen met bevestigde productdata) vervangen door de echte,
 * door Marc bevestigde mapping.
 */

export interface AxaltaColorMapping {
  name: string;
  code: string;
}

/** key = `${kleursoort} ${kleurkode}`.trim(), bv. "RAL 1". */
export const AXALTA_COLOR_MAP: Record<string, AxaltaColorMapping> = {
  "RAL 1": { name: "Axalta Anodic Bronze", code: "AE20108000320" },
  "RAL 2": { name: "Axalta Anodic Brown", code: "AE20108000420" },
  "RAL 3": { name: "Axalta Anodic Gold", code: "AE201011100820" },
  "RAL 4": { name: "Axalta Anodic Natura", code: "AE20107000120" },
  "RAL 5": { name: "Oxyplast Red Copper", code: "DM542U8001" },
};

/**
 * Vervangt kleursoort/kleurkode door de Axalta/leverancier-productnaam en
 * -code als er een mapping bestaat voor deze combinatie; anders worden de
 * originele waarden ongewijzigd teruggegeven.
 */
export function mapToAxaltaColor(
  kleursoort: string,
  kleurkode: string
): { kleursoort: string; kleurkode: string } {
  const mapping = AXALTA_COLOR_MAP[`${kleursoort} ${kleurkode}`.trim()];
  if (!mapping) {
    return { kleursoort, kleurkode };
  }
  return { kleursoort: mapping.name, kleurkode: mapping.code };
}

/** True als deze kleursoort/kleurkode-combinatie een Axalta-mapping heeft. */
export function isAxaltaMappedColor(kleursoort: string, kleurkode: string): boolean {
  return `${kleursoort} ${kleurkode}`.trim() in AXALTA_COLOR_MAP;
}
