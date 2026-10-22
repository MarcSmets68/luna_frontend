"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AFDELING_LABELS,
  groupByWeek,
  type Afdeling,
  type PlanningEntry,
  type PlanningWeekGroup,
} from "../lib/build-planning";

type Filter = "alle" | Afdeling;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "led-montage", label: AFDELING_LABELS["led-montage"] },
  { value: "lak", label: AFDELING_LABELS.lak },
];

const DASH = "\u2014";

function formatDate(iso: string | null): string {
  if (!iso) return DASH;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatQty(value: number | null): string {
  if (value === null) return DASH;
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function countBy(entries: PlanningEntry[], afdeling: Afdeling): number {
  return entries.filter((e) => e.afdeling === afdeling).length;
}

export function ProductieplanningPage({
  entries,
  errors = [],
  today = new Date(),
}: {
  entries: PlanningEntry[];
  /** Per-afdeling load errors; the other afdeling is still shown. */
  errors?: { afdeling: Afdeling; message: string }[];
  today?: Date;
}) {
  const [filter, setFilter] = useState<Filter>("alle");

  const visible = useMemo(
    () => (filter === "alle" ? entries : entries.filter((e) => e.afdeling === filter)),
    [entries, filter]
  );
  const groups = useMemo(() => groupByWeek(visible, today), [visible, today]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Productie
      </div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[26px] font-bold text-foreground">Planning</h1>
        <p className="text-[13px] text-muted-foreground">
          Open productielijnen per week - LED-montage op leverdatum, lak op deadline.
        </p>
      </div>

      {errors.map((error) => (
        <p
          key={error.afdeling}
          role="alert"
          className="mb-4 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning-fg"
        >
          {AFDELING_LABELS[error.afdeling]} kon niet geladen worden: {error.message}
        </p>
      ))}

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Afdeling">
        {FILTERS.map((f) => {
          const count = f.value === "alle" ? entries.length : countBy(entries, f.value);
          return (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label} ({count})
            </Button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen open productielijnen.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <WeekSection key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekSection({ group }: { group: PlanningWeekGroup }) {
  const led = countBy(group.entries, "led-montage");
  const lak = countBy(group.entries, "lak");

  return (
    <section aria-label={group.label} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          className={cn(
            "text-base font-semibold text-foreground",
            group.tone === "overdue" && "rounded-full bg-warning-bg px-3 py-0.5 text-warning-fg",
            group.tone === "current" && "text-primary"
          )}
        >
          {group.label}
        </h2>
        {group.range && <span className="text-sm text-muted-foreground">{group.range}</span>}
        <span className="text-xs text-muted-foreground">
          {group.entries.length} {group.entries.length === 1 ? "lijn" : "lijnen"} · {AFDELING_LABELS["led-montage"]} {led} ·{" "}
          {AFDELING_LABELS.lak} {lak}
        </span>
      </div>
      {/* Fixed layout so columns line up across the per-week tables. */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Datum</TableHead>
            <TableHead className="w-[110px]">Afdeling</TableHead>
            <TableHead className="w-[110px]">Bon</TableHead>
            <TableHead className="w-[22%]">Klant</TableHead>
            <TableHead>Artikel</TableHead>
            <TableHead className="w-[80px] text-right">Aantal</TableHead>
            <TableHead className="w-[20%]">Kleur / status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.entries.map((entry) => (
            <TableRow key={entry.key}>
              <TableCell>{formatDate(entry.datum)}</TableCell>
              <TableCell>
                <Badge variant={entry.afdeling === "lak" ? "secondary" : "outline"}>
                  {AFDELING_LABELS[entry.afdeling]}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/orders/${entry.bonnr}`} className="font-semibold text-primary hover:underline">
                  {entry.bonnr}
                  {entry.groepnr ? ` / ${entry.groepnr}` : ""}
                </Link>
              </TableCell>
              <TableCell>{entry.klant || DASH}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{entry.artnr || DASH}</span>
                  {entry.omschrijving && (
                    <span className="text-xs text-muted-foreground">{entry.omschrijving}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{formatQty(entry.aantal)}</TableCell>
              <TableCell>
                {entry.afdeling === "lak" ? (
                  <div className="flex flex-col gap-1">
                    {entry.kleur && <span className="text-xs">{entry.kleur}</span>}
                    {entry.status && (
                      <span className="text-xs text-muted-foreground">{entry.status}</span>
                    )}
                  </div>
                ) : (
                  DASH
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
