import type { OmzetanalyseResponse } from "@/lib/api-client";

// nl-BE display-formatting helpers for the Omzetanalyse dealers report.
// `null` renders as an em-dash everywhere on screen.

export const DASH = "\u2014";

export function formatQty(value: number | null): string {
  if (value === null || value === undefined) return DASH;
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export function formatInteger(value: number | null): string {
  if (value === null || value === undefined) return DASH;
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return DASH;
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Growth percentage with explicit sign and one decimal: `+12,3 %` /
 * `−4,0 %` (true minus sign). `null` returns an empty string (no badge).
 */
export function formatGrowth(value: number | null): string {
  if (value === null || value === undefined) return "";
  const abs = Math.abs(value).toLocaleString("nl-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const sign = value < 0 ? "\u2212" : "+";
  return `${sign}${abs}\u00A0%`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return DASH;
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return DASH;
  return `${d}/${m}/${y}`;
}

/** Column label for PERIODE mode, built from the filter dates. */
export function buildPeriodeLabel(datumVan: string | null, datumTot: string | null): string {
  if (datumVan && datumTot) return `${formatDate(datumVan)} t/m ${formatDate(datumTot)}`;
  if (datumVan) return `Vanaf ${formatDate(datumVan)}`;
  if (datumTot) return `Tot ${formatDate(datumTot)}`;
  return "Periode";
}

/** Column labels; PERIODE mode builds its label from the filter dates. */
export function getKolomLabels(response: OmzetanalyseResponse): string[] {
  if (response.modus === "PERIODE") {
    return response.kolommen.map(() =>
      buildPeriodeLabel(response.filters.datumVan, response.filters.datumTot)
    );
  }
  return response.kolommen.map((k) => k.label);
}
