export const CSV_DELIMITER = ";";
export const CSV_BOM = "\uFEFF";

/**
 * Escapes a single CSV field per RFC 4180-style rules: wrap in double quotes
 * if the value contains the delimiter, a double quote, or a newline; any
 * double quote inside is escaped by doubling it.
 */
export function escapeCsvField(value: string): string {
  const needsQuoting =
    value.includes(CSV_DELIMITER) || value.includes('"') || value.includes("\n") || value.includes("\r");
  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
