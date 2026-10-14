"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatBedragKort } from "@/lib/format";
import {
  chronological,
  columnTotals,
  dealerDelta,
  dealerHasAnyOmzet,
  dealersForTable,
  filterDealers,
  pickValue,
  sortDealers,
  type DealerSortKey,
} from "../../lib/dashboard-aggregations";
import type { DashDealer, DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { formatGrowth, formatInteger } from "../../lib/omzetanalyse-format";
import { DashboardSection } from "./dashboard-section";
import { perDealerNoticeText, SectionNotice } from "./section-notice";
import { Sparkline } from "./sparkline";
import { useTips } from "./dashboard-tips";

const DEFAULT_ROWS = 12;

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
  const tips = useTips();

  const periode = model.modus === "PERIODE";
  const colCount = model.jaren.length;
  const filtered = useMemo(
    () => dealersForTable(model.dealers, focusIdx, type, { query, includeZero }),
    [model.dealers, focusIdx, type, query, includeZero]
  );
  const hiddenByZero = useMemo(
    () => filterDealers(model.dealers, query).filter((d) => !dealerHasAnyOmzet(d, type)).length,
    [model.dealers, query, type]
  );
  const sorted = useMemo(
    () => sortDealers(filtered, sort.key, sort.dir, focusIdx, type),
    [filtered, sort, focusIdx, type]
  );
  const totals = useMemo(() => columnTotals(filtered, type, colCount), [filtered, type, colCount]);
  const max = useMemo(
    () => Math.max(1, ...filtered.flatMap((d) => d.perJaar.map((y) => pickValue(y, type)))),
    [filtered, type]
  );

  if (!model.perDealer) {
    return (
      <DashboardSection title="Dealers">
        <SectionNotice>{perDealerNoticeText()}</SectionNotice>
      </DashboardSection>
    );
  }

  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_ROWS);
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
        {sort.key === k ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
      </button>
    </th>
  );
  const prevLabel = model.jaren[focusIdx + 1]?.label;

  return (
    <DashboardSection title="Dealers in beeld" note="Hoe sterker de cel, hoe hoger de omzet. Klik op een dealer voor het volledige verhaal, op een kolomkop om te sorteren.">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <Input
          type="search"
          aria-label="Zoek dealer"
          placeholder="Zoek een dealer"
          className="max-w-64 rounded-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-[13px] text-foreground">
          <Checkbox checked={includeZero} onCheckedChange={(v) => setIncludeZero(v === true)} />
          Toon dealers zonder omzet
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" data-testid="dealers-table">
          <thead className="text-[11px] tracking-[0.05em] text-muted-foreground uppercase">
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
                  <th scope="col" className="px-3 py-2 text-center font-semibold">
                    Verloop
                  </th>
                  {cols.map((c) => th(`jaar:${c.idx}`, c.isYtd ? `${c.label}*` : c.label))}
                  {th("delta", prevLabel ? `t.o.v. ${prevLabel}` : "Verschil")}
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
                max={max}
                prevLabel={prevLabel}
                onSelect={onSelect}
                tips={tips}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold" data-testid="dealers-totals">
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
                  <td />
                  {cols.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-right">
                      {formatInteger(totals[c.idx])}
                    </td>
                  ))}
                  <td />
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
        {sorted.length > DEFAULT_ROWS && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="font-semibold text-primary-600 hover:underline"
          >
            {showAll ? "Toon minder" : `Toon alle ${formatInteger(sorted.length)} dealers`}
          </button>
        )}
        {!includeZero && hiddenByZero > 0 && (
          <span>
            Verborgen: {hiddenByZero} dealer{hiddenByZero === 1 ? "" : "s"} zonder omzet.
          </span>
        )}
        {model.jaren.some((j) => j.isYtd) && <span>* lopend jaar</span>}
      </div>
    </DashboardSection>
  );
}

/** Continuous heat cell: intensity + glow scale with sqrt(value/max). */
function heatCell(v: number, max: number, focused: boolean): React.CSSProperties {
  const t = v > 0 ? Math.sqrt(v / max) : 0;
  const style: React.CSSProperties = {};
  if (v > 0) {
    style.background = `color-mix(in srgb, var(--primary) ${Math.round(12 + t * 76)}%, var(--muted))`;
    if (t > 0.72) {
      style.boxShadow = `0 0 ${Math.round(6 + t * 12)}px color-mix(in srgb, var(--primary) ${Math.round(t * 50)}%, transparent)`;
      style.color = "var(--primary-foreground)";
      style.fontWeight = 600;
    }
  }
  if (focused) {
    style.outline = "1.5px solid color-mix(in srgb, var(--primary) 70%, transparent)";
    style.outlineOffset = "-1.5px";
  }
  return style;
}

function DealerRow({
  d,
  cols,
  focusIdx,
  type,
  periode,
  max,
  prevLabel,
  onSelect,
  tips,
}: {
  d: DashDealer;
  cols: { key: string; label: string; isYtd: boolean; idx: number }[];
  focusIdx: number;
  type: OmzetType;
  periode: boolean;
  max: number;
  prevLabel?: string;
  onSelect: (klnr: number) => void;
  tips: ReturnType<typeof useTips>;
}) {
  const delta = dealerDelta(d, focusIdx, type);
  const cur = d.perJaar[focusIdx];
  const prev = d.perJaar[focusIdx + 1];
  const curV = cur ? pickValue(cur, type) : 0;
  const prevV = prev ? pickValue(prev, type) : 0;
  const deltaTip = () => [
    d.naam,
    `${prevLabel} \u2192 ${cols.find((c) => c.idx === focusIdx)?.label ?? ""}`,
    `${curV - prevV >= 0 ? "+" : "\u2212"}${formatBedragKort(Math.abs(curV - prevV))}`,
  ];
  return (
    <tr
      data-testid="dealer-row"
      onClick={() => onSelect(d.klnr)}
      className="cursor-pointer border-b border-border/50 hover:bg-muted/40"
    >
      <td className="max-w-56 px-3 py-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(d.klnr);
          }}
          className="max-w-full truncate text-left font-medium text-foreground outline-none hover:underline focus-visible:underline"
        >
          {d.naam}
        </button>
        <span className="ml-2 text-[11px] text-muted-foreground">{d.klnr}</span>
      </td>
      {periode ? (
        <>
          <td className="px-3 py-1.5 text-right" style={heatCell(curV, max, true)}>
            {curV !== 0 ? formatInteger(curV) : "\u2013"}
          </td>
          <td className="px-3 py-1.5 text-right">{formatInteger(d.perJaar[0]?.orders ?? 0)}</td>
        </>
      ) : (
        <>
          <td className="w-24 px-3 py-1.5">
            <Sparkline values={chronological(d.perJaar.map((y) => pickValue(y, type)))} />
          </td>
          {cols.map((c) => {
            const v = pickValue(d.perJaar[c.idx], type);
            return (
              <td
                key={c.key}
                className="px-2 py-1.5 text-right tabular-nums"
                style={heatCell(v, max, c.idx === focusIdx)}
              >
                {v !== 0 ? formatInteger(v) : "\u2013"}
              </td>
            );
          })}
          <td
            className={cn(
              "px-3 py-1.5 text-right whitespace-nowrap",
              delta !== null && (delta < 0 ? "text-destructive" : "text-success-fg")
            )}
            onPointerEnter={(e) => {
              if (e.pointerType === "touch" || !prevLabel) return;
              tips.show(deltaTip(), e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.pointerType === "touch" || !prevLabel) return;
              tips.move(e.clientX, e.clientY);
            }}
            onPointerLeave={tips.hide}
          >
            {delta !== null ? formatGrowth(delta) : prevLabel && prevV === 0 && curV > 0 ? (
              <span className="text-success-fg">nieuw</span>
            ) : (
              "\u2014"
            )}
          </td>
        </>
      )}
    </tr>
  );
}
