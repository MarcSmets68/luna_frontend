import type { OfferteItem } from "@/lib/api-client";

export function formatBedrag(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatBedragKort(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${sign}€ ${Math.round(abs / 1000)}k`;
  }
  return `${sign}€ ${Math.round(abs)}`;
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
