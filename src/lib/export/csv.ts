export const CSV_DELIMITER = ";";
export const CSV_BOM = "\uFEFF";

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?$/i;

export type EscapeCsvFieldOptions = {
  /**
   * Marks the value as coming from a numeric column (e.g. a negative amount).
   * Genuine numbers such as "-12.5" are then left untouched; a "numeric" value
   * that is not a plain number is still neutralised like text.
   */
  numeric?: boolean;
};

/**
 * Escapes a single CSV field per RFC 4180-style rules: wrap in double quotes
 * if the value contains the delimiter, a double quote, or a newline; any
 * double quote inside is escaped by doubling it.
 *
 * Against CSV/formula injection, text values starting with `=`, `+`, `-`,
 * `@`, a tab or a carriage return are prefixed with an apostrophe (before
 * quoting) so spreadsheet software does not evaluate them.
 */
export function escapeCsvField(value: string, options: EscapeCsvFieldOptions = {}): string {
  const safeNumber = options.numeric === true && PLAIN_NUMBER.test(value);
  const neutralised = !safeNumber && FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  const needsQuoting =
    neutralised.includes(CSV_DELIMITER) ||
    neutralised.includes('"') ||
    neutralised.includes("\n") ||
    neutralised.includes("\r");
  if (!needsQuoting) return neutralised;
  return `"${neutralised.replace(/"/g, '""')}"`;
}
