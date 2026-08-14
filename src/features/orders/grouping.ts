/**
 * Grouping Utilities
 * Functions for data grouping and key generation
 * Ported 1:1 from bestellingLak (client/utils/grouping.ts)
 */

import type { OrderItem } from "./types";

export function getColorKey(item: OrderItem): string {
  return `${item.kleursoort}|${item.kleurkode}|${item.afwerking}|${item.techniek}`;
}

export function getSupplierGroupKey(item: OrderItem): string {
  return (item.lakNaam || "").trim() || "(geen leverancier)";
}

export function makeSupplierPageKey(colorKey: string, supplierName: string): string {
  return `${colorKey}|${supplierName}`;
}

export function buildColorKey(item: OrderItem): string {
  return `${item.kleursoort}|${item.kleurkode}|${item.afwerking || ""}|${item.techniek || ""}`;
}

export function groupItemsByColor<T extends OrderItem>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const key = getColorKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  return groups;
}

export function groupItemsBySupplier<T extends OrderItem>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const key = getSupplierGroupKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  return groups;
}
