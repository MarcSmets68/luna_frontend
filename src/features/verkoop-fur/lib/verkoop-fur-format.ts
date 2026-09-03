// Shared nl-BE display-formatting helpers for the Verkoop FUR report.
// Hoisted out of `verkoop-fur-page.tsx` so both the on-screen table and the
// PDF export table (`verkoop-fur-export.ts`) use identical formatting logic
// instead of duplicating it. See docs/architecture/verkoop-fur-export-ontwerp.md.

const DASH = "\u2014";

export function formatDate(iso: string | null): string {
  if (!iso) return DASH;
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatStuks(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
