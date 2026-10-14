"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildHeatScale,
  chronological,
  columnTotals,
  dealerDelta,
  dealersForTable,
  pickValue,
  sortDealers,
  type DealerSortKey,
} from "../../lib/dashboard-aggregations";
import type { DashDealer, DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { formatGrowth, formatInteger } from "../../lib/omzetanalyse-format";
import { DashboardSection } from "./dashboard-section";
import { perDealerNoticeText, SectionNotice } from "./section-notice";
import { Sparkline } from "./sparkline";

const MAX_ROWS = 200;
const HEAT = [0, 8, 16, 26, 36, 46];

export function DealersTable({
  model,
  focusIdx,
  type,
  onSelect,
}: {
  model: DashboardModel;
  focusIdx: number;
  type: OmzetType;
  onSelect: (klnr: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [includeZero, setIncludeZero] = useState(false);
  const [sort, setSort] = useState<{ key: DealerSortKey; dir: "asc" | "desc" }>({ key: "focus", dir: "desc" });
  const [showAll, setShowAll] = useState(false);

  const periode = model.modus === "PERIODE";
  const colCount = model.jaren.length;
  const heat = useMemo(
    () => buildHeatScale(model.dealers.flatMap((d) => d.perJaar.map((y) => pickValue(y, type)))),
    [model.dealers, type]
  );
  const filtered = useMemo(
    () => dealersForTable(model.dealers, focusIdx, type, { query, includeZeroInFocus: includeZero }),
    [model.dealers, focusIdx, type, query, includeZero]
  );
  const sorted = useMemo(
    () => sortDealers(filtered, sort.key, sort.dir, focusIdx, type),
    [filtered, sort, focusIdx, type]
  );
  const totals = useMemo(() => columnTotals(filtered, type, colCount), [filtered, type, colCount]);

  if (!model.perDealer) {
    return (
      <DashboardSection title="Dealers">
        <SectionNotice>{perDealerNoticeText(model)}</SectionNotice>
      </DashboardSection>
    );
  }

  const visible = showAll ? sorted : sorted.slice(0, MAX_ROWS);
  const cols = chronological(model.jaren.map((j, idx) => ({ ...j, idx })));
  const toggle = (key: DealerSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "naam" ? "asc" : "desc" }));
  const ariaSort = (key: DealerSortKey) =>
    sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  const th = (k: DealerSortKey, label: React.ReactNode, right = true) => (
    <th
      key={k}
      scope="col"
      aria-sort={ariaSort(k)}
      className={cn("px-3 py-2 font-semibold", right && "text-right")}
    >
      <button
        type="button"
        onClick={() => toggle(k)}
        className="outline-none hover:text-foreground focus-visible:underline"
      >
        {label}
        {sort.key === k ? (sort.dir === "asc" ? " \u25B2" : " \u25BC") : ""}
      </button>
    </th>
  );
  const focusLabel = model.jaren[focusIdx]?.label ?? "";

  return (
    <DashboardSection title={`Dealers (${formatInteger(model.dealers.length)})`}>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <Input
          type="search"
          aria-label="Zoek dealer"
          placeholder="Zoek op naam of klantnr"
          className="max-w-64 rounded-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-[13px] text-foreground">
          <Checkbox checked={includeZero} onCheckedChange={(v) => setIncludeZero(v === true)} />
          Toon dealers zonder omzet in {focusLabel}
        </label>
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Dealers zonder omzet in alle jaren ontbreken in dit rapport.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" data-testid="dealers-table">
          <thead className="border-b border-border text-[11px] tracking-[0.05em] text-muted-foreground uppercase">
            <tr>
              {th("naam", "Dealer", false)}
              {periode ? (
                <>
                  {th("focus", "Omzet")}
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Orders
                  </th>
                </>
              ) : (
                <>
                  {cols.map((c) => th(`jaar:${c.idx}`, c.label))}
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Trend
                  </th>
                  {th("delta", "\u0394")}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <DealerRow
                key={d.klnr}
                d={d}
                cols={cols}
                focusIdx={focusIdx}
                type={type}
                periode={periode}
                heat={heat}
                onSelect={onSelect}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold" data-testid="dealers-totals">
              <td className="px-3 py-2">Totaal ({formatInteger(filtered.length)})</td>
              {periode ? (
                <>
                  <td className="px-3 py-2 text-right">{formatInteger(totals[0])}</td>
                  <td className="px-3 py-2 text-right">
                    {formatInteger(filtered.reduce((s, d) => s + d.perJaar[0].orders, 0))}
                  </td>
                </>
              ) : (
                <>
                  {cols.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-right">
                      {formatInteger(totals[c.idx])}
                    </td>
                  ))}
                  <td />
                  <td />
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      {!showAll && sorted.length > MAX_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-[13px] font-semibold text-primary-600 hover:underline"
        >
          Toon alle {formatInteger(sorted.length)}
        </button>
      )}
    </DashboardSection>
  );
}

function cell(level: number): React.CSSProperties {
  return { backgroundColor: `color-mix(in srgb, var(--primary) ${HEAT[level]}%, transparent)` };
}

function DealerRow({
  d,
  cols,
  focusIdx,
  type,
  periode,
  heat,
  onSelect,
}: {
  d: DashDealer;
  cols: { key: string; idx: number }[];
  focusIdx: number;
  type: OmzetType;
  periode: boolean;
  heat: (v: number) => 0 | 1 | 2 | 3 | 4 | 5;
  onSelect: (klnr: number) => void;
}) {
  const delta = dealerDelta(d, focusIdx, type);
  return (
    <tr
      data-testid="dealer-row"
      onClick={() => onSelect(d.klnr)}
      className="cursor-pointer border-b border-border hover:bg-muted/40"
    >
      <td className="px-3 py-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(d.klnr);
          }}
          className="text-left font-medium text-foreground outline-none hover:underline focus-visible:underline"
        >
          {d.naam}
        </button>
        <span className="ml-2 text-[11px] text-muted-foreground">{d.klnr}</span>
      </td>
      {periode ? (
        <>
          <td className="px-3 py-1.5 text-right" style={cell(heat(pickValue(d.perJaar[0], type)))}>
            {formatInteger(pickValue(d.perJaar[0], type))}
          </td>
          <td className="px-3 py-1.5 text-right">{formatInteger(d.perJaar[0].orders)}</td>
        </>
      ) : (
        <>
          {cols.map((c) => {
            const v = pickValue(d.perJaar[c.idx], type);
            return (
              <td
                key={c.key}
                className={cn("px-3 py-1.5 text-right", c.idx === focusIdx && "font-semibold")}
                style={cell(heat(v))}
              >
                {formatInteger(v)}
              </td>
            );
          })}
          <td className="px-3 py-1.5">
            <Sparkline values={chronological(d.perJaar.map((y) => pickValue(y, type)))} />
          </td>
          <td
            className={cn(
              "px-3 py-1.5 text-right",
              delta !== null && (delta < 0 ? "text-destructive" : "text-success-fg")
            )}
          >
            {delta === null ? "\u2014" : formatGrowth(delta)}
          </td>
        </>
      )}
    </tr>
  );
}
