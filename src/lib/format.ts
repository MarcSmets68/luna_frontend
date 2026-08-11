import type { OfferteItem } from "@/lib/api-client";

export function formatBedrag(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDatum(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("nl-BE");
}

export function statusLabel(item: OfferteItem): string {
  if (item.verkocht) return "Verkocht";
  if (item.verloren) return "Verloren";
  if (item.passief) return "Passief";
  return "Open";
}
