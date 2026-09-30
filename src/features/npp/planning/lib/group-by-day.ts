import type { PlanningQueueItem } from "@/lib/api-client";

export type PlanningDayGroup = {
  key: string;
  label: string;
  tone: "overdue" | "normal" | "none";
  items: PlanningQueueItem[];
};

/** Parses "YYYY-MM-DD" as a LOCAL date (new Date(iso) would be UTC -> off-by-one). */
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const dateFormatter = new Intl.DateTimeFormat("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * Groups already-sorted queue items by delivery day. Consecutive items
 * with the same levDatum share a group; all past dates merge into one
 * "Achterstallig" group; the no-date group is always last.
 */
export function groupByDay(items: PlanningQueueItem[], today: Date): PlanningDayGroup[] {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const groups: PlanningDayGroup[] = [];
  const noDate: PlanningQueueItem[] = [];

  for (const item of items) {
    if (item.levDatum === null) {
      noDate.push(item);
      continue;
    }

    const date = parseLocalDate(item.levDatum);
    let key: string;
    let label: string;
    let tone: PlanningDayGroup["tone"] = "normal";

    if (date.getTime() < todayStart.getTime()) {
      key = "overdue";
      label = "Achterstallig";
      tone = "overdue";
    } else if (date.getTime() === todayStart.getTime()) {
      key = item.levDatum;
      label = "Vandaag";
    } else if (date.getTime() === tomorrowStart.getTime()) {
      key = item.levDatum;
      label = "Morgen";
    } else {
      key = item.levDatum;
      label = dateFormatter.format(date);
    }

    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label, tone, items: [item] });
    }
  }

  if (noDate.length > 0) {
    groups.push({ key: "no-date", label: "Geen leverdatum", tone: "none", items: noDate });
  }

  return groups;
}
