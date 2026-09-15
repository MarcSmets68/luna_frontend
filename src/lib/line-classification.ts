/**
 * Bon/offerte lines with artnr "K00" (case-insensitive, ignoring surrounding
 * whitespace) are section-title rows inserted by the legacy system, not real
 * articles. Do NOT use the `kolomtitel` flag for this check - exact/normalized
 * artnr match is the confirmed rule (Marc, 2026).
 */
export function isTitleLine(artnr: string): boolean {
  return artnr.trim().toUpperCase() === "K00";
}

/** Tailwind class applying Noma Green (primary-600) to a title lines text. */
export const TITLE_LINE_TEXT_CLASS = "text-primary-600" as const;

/** Sum-style aggregation helper: filters out title lines before reducing. */
export function excludeTitleLines<T extends { artnr: string }>(lines: T[]): T[] {
  return lines.filter((line) => !isTitleLine(line.artnr));
}
