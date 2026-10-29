export const CSV_DELIMITER = ";";
export const CSV_BOM = "\uFEFF";

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
// A formula trigger right after a `,` or `;` (optionally after spaces) would
// start a new cell when a spreadsheet splits on that character instead of on
// CSV_DELIMITER (e.g. a comma list separator in en-US locales).
const EMBEDDED_FORMULA_TRIGGER = /([,;] *)(?=[=+\-@\t\r])/g;
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
 * if the value contains a `;` or `,` (so it stays one cell whichever list
 * separator the spreadsheet uses), a double quote, or a newline; any double
 * quote inside is escaped by doubling it.
 *
 * Against CSV/formula injection, text values starting with `=`, `+`, `-`,
 * `@`, a tab or a carriage return are prefixed with an apostrophe (before
 * quoting) so spreadsheet software does not evaluate them. The same applies
 * to such a character following a `,` or `;` inside the value, in case the
 * spreadsheet splits the line on a different separator than CSV_DELIMITER.
 */
export function escapeCsvField(value: string, options: EscapeCsvFieldOptions = {}): string {
  const safeNumber = options.numeric === true && PLAIN_NUMBER.test(value);
  if (safeNumber) return value;
  const neutralised = (FORMULA_TRIGGER.test(value) ? `'${value}` : value).replace(
    EMBEDDED_FORMULA_TRIGGER,
    "$1'",
  );
  const needsQuoting =
    neutralised.includes(";") ||
    neutralised.includes(",") ||
    neutralised.includes('"') ||
    neutralised.includes("\n") ||
    neutralised.includes("\r");
  if (!needsQuoting) return neutralised;
  return `"${neutralised.replace(/"/g, '""')}"`;
}
