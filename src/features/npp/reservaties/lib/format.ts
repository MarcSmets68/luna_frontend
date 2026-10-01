import type { ReservatieEffectiefStatus, ReservatieQueueItem } from "../types";

/** "YYYY-MM-DD" -> "DD/MM/YYYY" (string-based, no Date/timezone involved). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function queueItemKey(item: Pick<ReservatieQueueItem, "bonnr" | "groepnr">): string {
  return `${item.bonnr}-${item.groepnr}`;
}

export function bonLabel(bonnr: number, groepnr: number): string {
  return groepnr > 0 ? `Bon ${bonnr} / ${groepnr}` : `Bon ${bonnr}`;
}

export const EFFECTIEF_STATUS_LABEL: Record<ReservatieEffectiefStatus, string> = {
  volledig_effectief: "Volledig effectief",
  gedeeltelijk_effectief: "Gedeeltelijk effectief",
  geen_effectief: "Geen effectief",
  niet_effectief: "Niet effectief",
};
