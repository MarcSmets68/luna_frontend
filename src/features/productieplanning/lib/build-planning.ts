import type { LakproductieItem, PlanningQueueItem } from "@/lib/api-client";

export type Afdeling = "led-montage" | "lak";

export const AFDELING_LABELS: Record<Afdeling, string> = {
  "led-montage": "LED-montage",
  lak: "Lak",
};

export type PlanningEntry = {
  key: string;
  afdeling: Afdeling;
  bonnr: number;
  groepnr: number | null;
  klant: string;
  artnr: string;
  omschrijving: string;
  aantal: number | null;
  /** "YYYY-MM-DD" or null. LED-montage: bon leverdatum; lak: deadline. */
  datum: string | null;
  /** Lak only: kleur/behandeling and status. */
  kleur: string | null;
  status: string | null;
};

export type PlanningWeekGroup = {
  key: string;
  label: string;
  /** "dd/mm - dd/mm" for real weeks, null for overdue/no-date groups. */
  range: string | null;
  tone: "overdue" | "current" | "normal" | "none";
  entries: PlanningEntry[];
};

/** Parses "YYYY-MM-DD" as a LOCAL date (new Date(iso) would be UTC -> off-by-one). */
function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfIsoWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - offset);
}

export function isoWeekNumber(date: Date): number {
  const thursday = startOfIsoWeek(date);
  thursday.setDate(thursday.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstWeekStart = startOfIsoWeek(firstThursday);
  return 1 + Math.round((thursday.getTime() - firstWeekStart.getTime()) / (7 * 86_400_000));
}

function toIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function formatDayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function fromLedMontage(items: PlanningQueueItem[]): PlanningEntry[] {
  return items.map((item) => ({
    key: `led-montage|${item.bonnr}|${item.groepnr}|${item.lijnnr}`,
    afdeling: "led-montage",
    bonnr: item.bonnr,
    groepnr: item.groepnr,
    klant: item.klant,
    artnr: item.artnr.trim(),
    omschrijving: item.omschrijving.trim(),
    aantal: item.aantal,
    datum: item.levDatum,
    kleur: null,
    status: null,
  }));
}

/** Only order-bound lak lines (min-max-voorraad rows have no bon/deadline). */
export function fromLak(items: LakproductieItem[]): PlanningEntry[] {
  return items
    .filter((item) => item.bron !== "min-max-voorraad" && item.bonnr !== null)
    .map((item) => ({
      key: ["lak", item.bron, item.bonnr, item.lijnnr ?? "", item.prodLijnnr ?? "", item.artnr].join("|"),
      afdeling: "lak",
      bonnr: item.bonnr as number,
      groepnr: item.groepnr,
      klant: item.klant ?? "",
      artnr: item.artnr.trim(),
      omschrijving: item.omschrijving.trim(),
      aantal: item.aantal,
      datum: item.deadline,
      kleur: item.groepeerKleur || item.behandeling || null,
      status: item.status,
    }));
}

function compareEntries(a: PlanningEntry, b: PlanningEntry): number {
  if (a.datum !== b.datum) {
    if (a.datum === null) return 1;
    if (b.datum === null) return -1;
    return a.datum < b.datum ? -1 : 1;
  }
  if (a.bonnr !== b.bonnr) return a.bonnr - b.bonnr;
  if (a.afdeling !== b.afdeling) return a.afdeling < b.afdeling ? -1 : 1;
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

/**
 * Groups entries per ISO week (Monday start). Everything before today is
 * one "Achterstallig" group (first), undated entries are last.
 */
export function groupByWeek(entries: PlanningEntry[], today: Date): PlanningWeekGroup[] {
  const todayIso = toIso(startOfDay(today));
  const currentWeekStart = startOfIsoWeek(today).getTime();
  const nextWeekStart = currentWeekStart + 7 * 86_400_000;

  const overdue: PlanningEntry[] = [];
  const noDate: PlanningEntry[] = [];
  const weeks = new Map<string, PlanningWeekGroup>();

  for (const entry of [...entries].sort(compareEntries)) {
    if (entry.datum === null) {
      noDate.push(entry);
      continue;
    }
    if (entry.datum < todayIso) {
      overdue.push(entry);
      continue;
    }

    const weekStart = startOfIsoWeek(parseLocalDate(entry.datum));
    const key = toIso(weekStart);
    let group = weeks.get(key);
    if (!group) {
      const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
      const weekNr = isoWeekNumber(weekStart);
      const time = weekStart.getTime();
      const label =
        time === currentWeekStart
          ? `Deze week (week ${weekNr})`
          : time === nextWeekStart
            ? `Volgende week (week ${weekNr})`
            : `Week ${weekNr}`;
      group = {
        key,
        label,
        range: `${formatDayMonth(weekStart)} - ${formatDayMonth(weekEnd)}`,
        tone: time === currentWeekStart ? "current" : "normal",
        entries: [],
      };
      weeks.set(key, group);
    }
    group.entries.push(entry);
  }

  const groups: PlanningWeekGroup[] = [];
  if (overdue.length > 0) {
    groups.push({ key: "overdue", label: "Achterstallig", range: null, tone: "overdue", entries: overdue });
  }
  groups.push(...weeks.values());
  if (noDate.length > 0) {
    groups.push({ key: "no-date", label: "Geen datum", range: null, tone: "none", entries: noDate });
  }
  return groups;
}
