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

/**
 * The 5 mutually-exclusive kinds an offlijn/bonlijn row can be, derived from
 * its flags (subtotaal/kolomtitel/infolijn) and its artnr ("K00" = titel).
 * Precedence matches the server-side guard: at most one of
 * subtotaal/kolomtitel/infolijn can be true, checked before falling back to
 * the artnr-based titel check.
 */
export type LineKind = "artikel" | "titel" | "subtotaal" | "kolomtitel" | "infolijn";

export function classifyLineKind(lijn: {
  artnr: string;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
}): LineKind {
  if (lijn.subtotaal) return "subtotaal";
  if (lijn.kolomtitel) return "kolomtitel";
  if (lijn.infolijn) return "infolijn";
  if (isTitleLine(lijn.artnr)) return "titel";
  return "artikel";
}

/**
 * Inverse of `classifyLineKind`: the flags (and, for "titel", the artnr) a
 * new/edited line should carry for a given kind. Used by the "nieuwe lijn"
 * type-select in the offerte lijnen editor.
 */
export function flagsForLineKind(kind: LineKind): {
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
  artnr?: string;
} {
  switch (kind) {
    case "subtotaal":
      return { subtotaal: true, kolomtitel: false, infolijn: false };
    case "kolomtitel":
      return { subtotaal: false, kolomtitel: true, infolijn: false };
    case "infolijn":
      return { subtotaal: false, kolomtitel: false, infolijn: true };
    case "titel":
      return { subtotaal: false, kolomtitel: false, infolijn: false, artnr: "K00" };
    default:
      return { subtotaal: false, kolomtitel: false, infolijn: false };
  }
}
