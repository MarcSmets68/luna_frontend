// Pure, library-independent transform functions for the Verkoop FUR export
// feature (PDF + CSV). No jsPDF/DOM/Blob usage here - that lives in
// `verkoop-fur-export-toolbar.tsx`. Keeping these pure makes them cheap to
// unit test in isolation (see __tests__/verkoop-fur-export.test.ts).
//
// See docs/architecture/verkoop-fur-export-ontwerp.md for the full spec.

import type { VerkoopFurItem } from "@/lib/api-client";
import { CSV_BOM, CSV_DELIMITER, escapeCsvField } from "@/lib/export/csv";
import { formatDate, formatStuks } from "./verkoop-fur-format";

export const CSV_HEADERS = [
  "Klnr",
  "Naam",
  "Aantal FUR-orders",
  "Totaal aantal stuks",
  "Laatste besteldatum",
] as const;

export const PDF_TABLE_HEADERS = [
  "Klnr",
  "Naam",
  "Aantal FUR-orders",
  "Totaal aantal stuks",
  "Laatste besteldatum",
] as const;

// Shared CSV helpers live in src/lib/export/csv.ts; re-exported here so
// existing imports keep working.
export { escapeCsvField };

/**
 * Builds the full CSV file content (including UTF-8 BOM, period-info
 * preamble, header row, and data rows) for the Verkoop FUR export.
 *
 * Values are RAW/unformatted (not run through formatDate/formatStuks) per
 * the design's explicit decision - this file is meant to be re-processable,
 * not a visual copy of the on-screen table.
 */
export function buildCsvContent(
  items: VerkoopFurItem[],
  periodeVan: string,
  periodeTot: string
): string {
  const lines: string[] = [];

  lines.push(`Periode van${CSV_DELIMITER}${periodeVan}`);
  lines.push(`Periode tot${CSV_DELIMITER}${periodeTot}`);
  lines.push("");
  lines.push(CSV_HEADERS.join(CSV_DELIMITER));

  for (const item of items) {
    const row = [
      String(item.klnr),
      escapeCsvField(item.naam),
      String(item.aantalFurOrders),
      String(item.totaalAantalStuks),
      item.laatsteBesteldatum ?? "",
    ];
    lines.push(row.join(CSV_DELIMITER));
  }

  return CSV_BOM + lines.join("\n");
}

/**
 * Builds the row arrays passed to `autoTable` for the PDF export - formatted
 * with the same nl-BE `formatDate`/`formatStuks` helpers used on screen, for
 * visual consistency between the table and the exported PDF.
 */
export function buildPdfTableRows(items: VerkoopFurItem[]): string[][] {
  return items.map((item) => [
    String(item.klnr),
    item.naam,
    String(item.aantalFurOrders),
    formatStuks(item.totaalAantalStuks),
    formatDate(item.laatsteBesteldatum),
  ]);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Builds the shared export file base name (without extension), e.g.
 * `verkoop-fur_2026-09-03`, based on the client-side current date at the
 * moment of export.
 */
export function buildExportFileBaseName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `verkoop-fur_${year}-${month}-${day}`;
}
